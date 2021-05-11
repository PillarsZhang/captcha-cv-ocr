const tesseract_ocr = require("./tesseract_ocr");
const sharp_cv = require("./sharp_cv");

var ocr;
const cv = sharp_cv;

class dots_and_chars {
    recognize = async (image) =>{
        var timeBegin = Date.now();
        var cvResult = await cv(image);
        if (debugFlag) {
            let cvDebugInfo = {result: "length=" + cvResult.result.length, time : cvResult.time}
            console.log("cv", cvDebugInfo)
        }

        var charPromise = [];
        cvResult.result.forEach((value, index) => {
            charPromise[index] = ocr.recognize(value); //console.log(value);
        })

        var charList = await Promise.all(charPromise);
        charList.forEach((value, index) => {
            if (['1', 'I'].includes(value.result)){
                console.log(`index: ${index}, char: ${value.result}, w: ${cvResult.marks[index].w}, h: ${cvResult.marks[index].h}, h/w: ${cvResult.marks[index].h/cvResult.marks[index].w}`);
                if (cvResult.marks[index].h/cvResult.marks[index].w < 2.2) value.result = '1'
                  else value.result = 'I';
            }
            if (['0', 'O'].includes(value.result)){
                console.log(`index: ${index}, char: ${value.result}, w: ${cvResult.marks[index].w}, h: ${cvResult.marks[index].h}, h/w: ${cvResult.marks[index].h/cvResult.marks[index].w}`);
                if (cvResult.marks[index].h/cvResult.marks[index].w < 1.1) value.result = 'O'
                  else value.result = '0';
            }
        })

        if (debugFlag) console.log(charList);
        var chars = charList.map((value, index) => value.result);
        return { result: chars.join(''), time: Date.now() - timeBegin };
    }

    init = async (workers = 4) =>{
        ocr = new tesseract_ocr(workers)
        await ocr.init();
    }
}

module.exports = new dots_and_chars();