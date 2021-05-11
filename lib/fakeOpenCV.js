const math = require("mathjs");

var main = {
    transformMath: ({buffer, size}) => {
        var unit8 = new Uint8Array(buffer);
        var sz = [size.height, size.width];
        var arr = Array.from(unit8);
        var mat = math.reshape(arr, sz);
        return {mat, sz};
    },
    transformBuffer: ({mat, sz}) => {
        var arr = math.reshape(math.clone(mat), [-1]).valueOf();
        return {buffer: new Uint8Array(arr), size: {height: sz[0], width: sz[1]}};
    },
    inverse: ({mat, sz}) => {
        return({mat: math.add(255, math.dotMultiply(mat, -1)), sz});
    },
    dilateOrErode: ({mat, sz}, element, stat) => {
        var szElement = math.size(element).valueOf();
        var szMat2 = [sz[0] - szElement[0] + 1, sz[1] - szElement[1] + 1];
        var mat2 = math.zeros(szMat2[0], szMat2[1]);
        mat2 = math.map(mat2, (value, index, matrix) => {
            var index2 = math.add(index, szElement, -1).valueOf();
            var range = [math.range(index[0], index2[0], true), math.range(index[1], index2[1], true)];
            var matTemp = math.subset(mat, math.index(range[0], range[1]));
            matTemp = math.dotMultiply(math.dotMultiply(matTemp, element), stat);
            return math.max(matTemp);
        });
        return {mat: math.dotMultiply(mat2, stat), sz: szMat2};
    },
    erode: (imageMath, element) => main.dilateOrErode(imageMath, element, -1),
    dilate: (imageMath, element) => main.dilateOrErode(imageMath, element, 1),
    connectedComponents: ({mat, sz}) => {
        var tool = require("./new_connected_component_labeling_algorithm_for_binary_image");
        return tool(mat.valueOf(), sz);
    },
    rectangle: ({mat, sz}, points, color = 200) => {
        var mat2 = math.clone(mat);
        for(let i = 0; i < points.length; i++){
            var pointA = points[i][0];
            var pointB = points[i][0];
            for(let j = 1; j < points[i].length; j++){
                pointA = pointB;
                pointB = points[i][j];
                if (pointB[0] - pointA[0] != 0){
                    var k = (pointB[1] - pointA[1]) / (pointB[0] - pointA[0]);
                    var b = pointA[1] - k * pointA[0];
                    var x = pointA[0] <= pointB[0] ? math.range(pointA[0], pointB[0], true) : math.range(pointA[0], pointB[0], -1, true);
                    x = x.valueOf();
                    var y = math.round(math.add(math.dotMultiply(k, x), b));
                    y = y.valueOf();
                } else{
                    var y = pointA[1] <= pointB[1] ? math.range(pointA[1], pointB[1], true) : math.range(pointA[1], pointB[1], -1, true);
                    y = y.valueOf();
                    var x = math.dotMultiply(math.ones(math.size(y)), pointA[0]);
                    x = x.valueOf();
                }
                for(let l = 0; l < x.length; l++) mat2.subset(math.index(x[l], y[l]), color);
            }
        }
        return {mat: mat2, sz};
    },
    math: math
};

module.exports = main;