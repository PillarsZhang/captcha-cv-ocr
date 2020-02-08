/* 
使用腐蚀膨胀的形态学操作来优化处理流程
参考：http://www.opencv.org.cn/opencvdoc/2.3.2/html/doc/tutorials/imgproc/erosion_dilatation/erosion_dilatation.html
*/

const cv = require('opencv4nodejs');


cv.imshowscale = (name, image, scale = 10) => cv.imshow(name, image.resize(new cv.Size(image.cols*scale, image.rows*scale), 0, 0, cv.INTER_NEAREST));

cv.Contour.prototype.getCenterPoint = function () {
    //console.log(this);
    var M = this.moments();
    cX = M["m10"] / M["m00"];
    cY = M["m01"] / M["m00"];
    return new cv.Point(cX, cY);
};

async function clearStick(image){
    var w = 255, b = 0;
    var contours = image.findContours(cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);
    var points = [];  
    for(let i = 0; i < contours.length; i++){
        if (contours[i].area <= 2) points.push(contours[i].getPoints());
    }
    image.drawContours(points, -1, new cv.Vec(b, b, b), cv.FILLED);

    var result = await clearStickwb(image, w, b);
    result = await clearStickwb(result, b, w);
    return result;
}

async function clearStickwb(image, w, b){
    var templateData = [
        [w, b],
        [b, w],
    ];
    var template = new cv.Mat(templateData, cv.CV_8UC1);
    matchResult = image.matchTemplate(template, cv.TM_SQDIFF).convertTo(cv.CV_8U, 255, 0);
    matchResult = matchResult.bitwiseNot().copyMakeBorder(0, template.rows - 1, 0, template.cols - 1, 0);

    var template2Data = [
        [b, w],
        [w, b],
    ];
    var template2 = new cv.Mat(template2Data, cv.CV_8UC1);
    matchResult = matchResult.filter2D(-1, template2, new cv.Point(1, 1)) 
    
    matchResult = matchResult.bitwiseNot()
    result = image.bitwiseOr(matchResult.bitwiseNot());
    return result;
}

async function clearPillar(image){
    var w = 255, b = 0;

    var templateData = [
        [w, b, b, w],
        [w, b, b, w],
    ];
    var template = new cv.Mat(templateData, cv.CV_8UC1);
    matchResult = image.matchTemplate(template, cv.TM_SQDIFF).convertTo(cv.CV_8U, 255, 0);
    matchResult = matchResult.bitwiseNot().copyMakeBorder(0, template.rows - 1, 0, template.cols - 1, 0);

    var template2Data = [
        [w, w, b, b],
        [w, w, b, b],
    ];
    var template2 = new cv.Mat(template2Data, cv.CV_8UC1);
    matchResult = matchResult.filter2D(-1, template2, new cv.Point(1, 2)) 
    
    matchResult = matchResult.bitwiseNot()
    result = image.bitwiseOr(matchResult.bitwiseNot());

    return result;
}

async function clearLine(image, x = 2, y = 3){
    var kernel = cv.getStructuringElement (cv.MORPH_RECT, new cv.Size(x, y)); 
    var result = await image.morphologyEx (kernel, cv.MORPH_CLOSE);
    return result;
}


async function imagePartition(image){
    var image1 = image.bitwiseNot();
    var contours = image1.findContours(cv.RETR_EXTERNAL,cv.CHAIN_APPROX_NONE);

    contours = contours.sort((c0, c1) => c0.getCenterPoint().x - c1.getCenterPoint().x)
    var result = [];

    for(let i = 0; i < contours.length; i++){
        if (contours[i].area < 16) continue;
        let hole = new cv.Mat(image1.rows, image1.cols, cv.CV_8UC1, 0);
        hole.drawContours([contours[i].getPoints()], 0, new cv.Vec(255, 255, 255), cv.FILLED);
        let image2 = new cv.Mat(image1.rows, image1.cols, cv.CV_8UC1, 0);
        image1.copyTo(image2, hole);

        let rect = contours[i].boundingRect();

        image2 = image2.getRegion(rect).copyMakeBorder(15, 15, 15, 15, cv.BORDER_CONSTANT, 0);
        
        result.push(image2);
    }
    return result;
}

async function opencv_cv(buffer) {
    var timeBegin = Date.now();

    var image = [];
    image[0] = buffer;
    image[1] = await cv.imdecode(image[0]);
    image[2] = await image[1].cvtColor(cv.COLOR_BGR2GRAY);
    image[3] = await image[2].threshold(110, 255, cv.THRESH_BINARY)
    image[4] = await clearLine(image[3], 2, 3);
    image[5] = await clearPillar(image[4]);
    image[6] = await clearStick(image[5]);

    var imageFin = image[6];
    var imageList = await imagePartition(imageFin)
    if (imageList.length != 7) {
        image[4] = imageList.length > 7 ? await clearLine(imageFin, 2, 2) : await clearLine(imageFin, 3, 3);
        image[5] = await clearPillar(image[4]);
        image[6] = await clearStick(image[5]);
        var imageFin = image[6];
        imageList = await imagePartition(imageFin)
    }

    if (debugFlag >= 10) {
        for(let i = 1; i < image.length; i++) cv.imshowscale('image - ' + i, image[i], 5);
        cv.waitKey(5000);
        for(let i = 1; i < image.length; i++) cv.destroyWindow('image - ' + i);
    }

    for(let i = 0; i < imageList.length; i++){
        imageList[i] = imageList[i].bitwiseNot();
        if (debugFlag >= 13) cv.imshowscale('imageList - ' + i, imageList[i], 5);
        imageList[i] = cv.imencode('.jpg', imageList[i])
    }
    if (debugFlag >= 20) {
        cv.waitKey(5000);
        for(let i = 1; i < imageList.length; i++) cv.destroyWindow('imageList - ' + i);
    }

    return { result: imageList, time: Date.now() - timeBegin };
};


module.exports = opencv_cv;