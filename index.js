"use strict";  

const fs = require("fs");
const path = require("path");
const loadImage = require("./lib/loadImage");

var modeModule;
global.debugFlag = 0;

class cvocr {
    constructor(mode = "simplest") {
        try {
            if (debugFlag) console.log("Debug Mode On!\n");
            modeModule = require(path.join(__dirname, "codes", mode));
        }
        catch (err) {
            console.error(`no this mode: ${mode}, path: ${path.join(__dirname, "codes", mode)}`);
            console.error(err);
            process.exit(1);
        }
    }
    recognize = async (img) => {
        var image = await loadImage(img);
        if (debugFlag) console.log(`image.length: ${image.length}`);
        return await modeModule.recognize(image);
    }
    init = async (workersNum1 = 2, workersNum2 = 1) => {
        await modeModule.init(workersNum1, workersNum2);
    }
}

module.exports = cvocr;