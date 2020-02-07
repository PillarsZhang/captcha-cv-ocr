const cv = require('opencv4nodejs');


cv.imshowscale = (name, image, scale = 10) => cv.imshow(name, image.resize(new cv.Size(image.cols*scale, image.rows*scale), 0, 0, cv.INTER_NEAREST));

cv.Contour.prototype.getCenterPoint = function () {
    //console.log(this);
    var M = this.moments();
    cX = M["m10"] / M["m00"];
    cY = M["m01"] / M["m00"];
    return new cv.Point(cX, cY);
};

async function clearLine(image){
    var w = 255, b = 0, o = -1, w2 = w;
    var result = image.copyMakeBorder(2, 2, 2, 2, cv.BORDER_CONSTANT, w);


    for(let i = 0; i < result.rows - 2; i++){
        for(let j = 0; j < result.cols - 2; j++){
            if (lineCompare(new cv.Point(i, j), new cv.Point(i+3, j+1), result, [[w,w], [b,b], [b,b], [w,w]])) {result.set(i+1, j, w), result.set(i+2, j, w)};
            if (lineCompare(new cv.Point(i, j), new cv.Point(i+1, j+3), result, [[w, b, b, w], [w, b, b, w]])) {result.set(i, j+1, w), result.set(i, j+2, w)};
            if (lineCompare(new cv.Point(i, j), new cv.Point(i+2, j), result, [[w], [b], [w]])) result.set(i+1, j, w);
            if (lineCompare(new cv.Point(i, j), new cv.Point(i, j+2), result, [[w, b, w]])) result.set(i, j+1, w);

        }
    }
    

    var contours = result.findContours(cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);

    var points = [];  
    for(let i = 0; i < contours.length; i++){
        if (contours[i].area <= 2) points.push(contours[i].getPoints());
    }

    result.drawContours(points, -1, new cv.Vec(b, b, b), cv.FILLED);

    for(let i = 0; i < result.rows - 2; i++){
        for(let j = 0; j < result.cols - 2; j++){
            if (lineCompare(new cv.Point(i, j), new cv.Point(i+1, j+2), result, [[o, b, w], [w, b, o]]) || lineCompare(new cv.Point(i, j), new cv.Point(i+1, j+2), result, [[w, b, o], [o, b, w]])) {result.set(i, j+1, w2); result.set(i+1, j+1, w2)};
            if (lineCompare(new cv.Point(i, j), new cv.Point(i+2, j+1), result, [[o, w], [b, b], [w, o]]) || lineCompare(new cv.Point(i, j), new cv.Point(i+2, j+1), result, [[w, o], [b, b], [o, w]])) {result.set(i+1, j, w2); result.set(i+1, j+1, w2)};
        }
    }
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
    var image4 = await clearLine(image3);

    if (debugFlag >= 12) {
        cv.imshowscale('image1', image1);
        cv.imshowscale('image2', image2);
        cv.imshowscale('image3', image3);
        cv.imshowscale('image4', image4);
        cv.waitKey(); 
    }

    var imageList = await imagePartition(image4)

    for(let i = 0; i < imageList.length; i++){
        imageList[i] = imageList[i].bitwiseNot();
        if (debugFlag >= 13) cv.imshowscale('imageList - ' + i, imageList[i]);
        imageList[i] = cv.imencode('.jpg', imageList[i])
    }
    if(debugFlag) cv.waitKey();

    return { result: imageList, time: Date.now() - timeBegin };
};


module.exports = opencv_cv;