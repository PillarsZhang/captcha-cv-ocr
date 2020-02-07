const tesseract_ocr = require("./tesseract_ocr");
var ocr;

class simplest {
    recognize = async (image) =>{
        var result = await ocr.recognize(image);
        if (debugFlag) console.log("ocr", result);
        result.result = result.result.slice(0, 4);
        return result;
    }
    init = async (workers = 1) =>{
        ocr = new tesseract_ocr(workers);
        await ocr.init();
    }
}

module.exports = new simplest();