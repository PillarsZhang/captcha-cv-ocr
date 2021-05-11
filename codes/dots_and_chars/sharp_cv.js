const cv = require('sharp');
const fakeOpenCV = require("../../lib/fakeOpenCV");
const fs = require("fs");

const main = async (file) => {
    var timeBegin = Date.now();
    var image = [];
    image[0] = cv(file);
    var meta = await image[0].metadata();
    //console.log(meta);
    var size = {width: meta.width, height: meta.height};

    //裁边
    image[1] = image[0].clone().extract({ left: 1, top: 1, width: meta.width-2, height: meta.height-2})
    size.width -= 2;
    size.height -= 2;
    //await showImage(image[1], '裁边');

    //灰度
    image[2] = image[1].clone().greyscale();
    //debugFlag && (await showImage(image[2], '灰度'));

    //二值化
    image[3] = image[2].clone().threshold(255).toColourspace('b-w');
    debugFlag && (await showImage(image[3], '二值化'));

    //空穴填充
    image[5] = image[3].clone().linear(-1, 255).convolve({
        width: 3,
        height: 3,
        kernel: [
            0, 1/4, 0, 
            1/4, 1, 1/4, 
            0, 1/4, 0
        ],
    })
    image[5] = await superDeepCopySharp(image[5]);
    image[5] = image[5].threshold(128).toColourspace('b-w').linear(-1, 255);
    debugFlag && (await showImage(image[5], '空穴填充'));

    //形态学膨胀
    var buffer = await image[5].clone().raw().toBuffer();
    var element = fakeOpenCV.math.ones(3, 3);
    var imageMath = fakeOpenCV.transformMath({buffer, size})
    var res = fakeOpenCV.dilate(imageMath, element);
    var resBuffer = fakeOpenCV.transformBuffer(res);
    image[4] = await cv(resBuffer.buffer, { raw: { width: resBuffer.size.width, height:resBuffer.size.height, channels: 1 }});
    debugFlag && (await showImage(image[4], '膨胀'));

    //连通域
    var res2 = fakeOpenCV.connectedComponents(fakeOpenCV.inverse(res));

    //分割及演示
    var points = [];
    var index2 = 0;
    var marks = [];
    res2.marks.forEach((value, index) => {
        var pos = value.position;
        function setPoints(index2, pos){
            points[index2] = [
                [pos.y, pos.x],
                [pos.y + pos.h - 1, pos.x],
                [pos.y + pos.h - 1, pos.x + pos.w - 1],
                [pos.y, pos.x + pos.w - 1],
                [pos.y, pos.x]
            ];
            marks[index2] = pos;
            marks[index2].area = pos.w * pos.h;
            marks[index2].cX = Math.floor(pos.x + pos.w / 2);
            marks[index2].cY = Math.floor(pos.y + pos.h / 2);
        }
        //针对超宽的目标块二次对半分割
        if (pos.w > pos.h * 1.5){
            pos = {x: pos.x, y: pos.y, w: Math.floor(pos.w / 2), h: pos.h};
            setPoints(index2++, pos);
            pos = {x: pos.x + pos.w, y: pos.y, w: pos.w, h: pos.h};
            setPoints(index2++, pos);
        } else{
            setPoints(index2++, pos);
        }
    });
    //points = [[[0, 0], [0, 20], [10, 20], [10, 0], [0, 0]]]
    var res3 = fakeOpenCV.rectangle(res, points);
    var resBuffer = fakeOpenCV.transformBuffer(res3);
    image[5] = cv(resBuffer.buffer, { raw: { width: resBuffer.size.width, height:resBuffer.size.height, channels: 1 }});
    //debugFlag && (await showImage(image[5], '分割'));
    //console.log(res2.marks);

    //取出字符块
    var imageList = [];
    marks.sort((a, b) => b.area - a.area);
    marks.splice(4);
    marks.sort((a, b) => a.cX - b.cX);
    var w = 45, h = 50;
    for (let i = 0; i < marks.length; i++){
        let imageExt = image[4]
          .clone()
          .extract({ left: marks[i].x, top: marks[i].y, width: marks[i].w, height: marks[i].h })
          .extend({
            top: Math.floor((h - marks[i].h) / 2),
            bottom: h - Math.floor((h - marks[i].h) / 2) - marks[i].h,
            left: Math.floor((w - marks[i].w) / 2),
            right: w - Math.floor((w - marks[i].w) / 2) - marks[i].w,
            background: "white"
          });
        let imageJPEG = await imageExt.jpeg({
            quality: 100,
            chromaSubsampling: '4:4:4'
        }).toBuffer();
        imageList[i] = imageJPEG;
        debugFlag && (await showImage(imageExt, i));
    }
    return { result: imageList, time: Date.now() - timeBegin, marks };
}

const showImage = async (image, name) => {
    var scale = 10;
    var imageCopy = await superDeepCopySharp(image);
    var meta = await imageCopy.metadata();
    imageCopy
      .clone()
      .resize({
        width: meta.width * scale,
        kernel: cv.kernel.nearest
      })
      .jpeg({
        quality: 100,
        chromaSubsampling: '4:4:4'
      })
      .toBuffer()
      .then( data => {
        var tmp = require('tmp');
        var tmpobj = tmp.dirSync({prefix: 'sharp_' });
        debugFlag && console.log('Dir: ', tmpobj.name);
        var join = require("path").join;
        var exec = require('child_process').exec;
        var tempPNGPath = join(tmpobj.name, `${name}.jpg`);
        fs.writeFileSync(tempPNGPath, data);
        exec(`explorer.exe "${tempPNGPath}"`);
      })
      .catch( err => {console.error(err)});
}

const superDeepCopySharp = async (image) => {
    var { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    var pixelArray = new Uint8ClampedArray(data.buffer);
    var { width, height, channels } = info;
    return cv(pixelArray, { raw: { width, height, channels } });
}

module.exports = main;
var debugFlag = false;


//debugFlag = true;
if (debugFlag) {
    //let code = "TTKO";
    //let code = "54JY";
    //let code = "7RVO";
    //let code = "R796";
    //let code = "XP1R";
    //let code = "XSVG";
    //let code = "XQKA";
    let code = "I8YO";
    let file = fs.readFileSync(`./examples/${code}.gif`);
    main(file)
      .then(res => console.log(res))
      .catch(err => {console.error(err)});
};