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

async function clearLine(image, x = 2, y = 3){
    var kernel = cv.getStructuringElement (cv.MORPH_RECT, new cv.Size(x, y)); 
    var result = image.dilate(kernel).erode(kernel);
    return result;
}

function lineCompare(pointA, pointB, image, gray){
    for(let i = pointA.x; i <= pointB.x; i++){
        for(let j = pointA.y; j <= pointB.y; j++){
            if (gray[i-pointA.x][j-pointA.y] != -1 && image.at(i, j) != gray[i-pointA.x][j-pointA.y]) return false;
        }
    }
    return true;
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

    var image1 = await cv.imdecode(buffer);
    var image2 = await image1.cvtColor(cv.COLOR_BGR2GRAY);
    var image3 = await image2.threshold(110, 255, cv.THRESH_BINARY)
    var image4 = await clearLine(image3, 2, 3);

    var imageList = await imagePartition(image4)
    if (imageList.length != 7) {
        image4 = imageList.length > 7 ? await clearLine(image3, 3, 3) : await clearLine(image3, 2, 2);
        imageList = await imagePartition(image4)
    }

    if (debugFlag >= 12) {
        cv.imshowscale('image1', image1);
        cv.imshowscale('image2', image2);
        cv.imshowscale('image3', image3);
        cv.imshowscale('image4', image4);
        cv.waitKey(); 
    }


    for(let i = 0; i < imageList.length; i++){
        imageList[i] = imageList[i].bitwiseNot();
        if (debugFlag >= 13) cv.imshowscale('imageList - ' + i, imageList[i]);
        imageList[i] = cv.imencode('.jpg', imageList[i])
    }
    if(debugFlag) cv.waitKey();

    return { result: imageList, time: Date.now() - timeBegin };
};


module.exports = opencv_cv;