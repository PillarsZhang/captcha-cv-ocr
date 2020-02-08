const tesseract_ocr = require("./tesseract_ocr");
const opencv_cv = require("./opencv_cv2");

var ocr;
const cv = opencv_cv;

class grids_and_equations {
    recognize = async (image) =>{
        var timeBegin = Date.now();
        var cvResult = await cv(image);
        if (debugFlag) {
            let cvDebugInfo = {result: "length=" + cvResult.result.length, time : cvResult.time}
            console.log("cv", cvDebugInfo)
        }

        var a = ocr.recognize(cvResult.result[0], "number");
        var e = ocr.recognize(cvResult.result[1], "symbol");
        var b = ocr.recognize(cvResult.result[2], "number");

        var [a, e, b] = await Promise.all([a, e, b]);
        if (debugFlag) console.log("a", a, "e", e, "b", b);
        var a = parseInt(a.result);
        var b = parseInt(b.result);
        var e = e.result;
        var c = 0;
        if(e == '+') c = a + b;
        if(e == 'x') c = a * b;
        return { result: c, equation: a + e + b + "=?", time: Date.now() - timeBegin };
    }

    init = async (numberWorkers = 2, symbolWorkers = 1) =>{
        ocr = new tesseract_ocr(numberWorkers, symbolWorkers)
        await ocr.init();
    }
}

module.exports = new grids_and_equations();