const path = require("path");
const cvocrModule = require(".");

global.debugFlag = 1;

var modeList = ["simplest", "grids_and_equations"];
//var modeList = ["grids_and_equations"];
//var modeList = ["simplest"];

(async () => {
    for(let i = 0; i < modeList.length; i++){
        let mode = modeList[i]
        let cvocr = new cvocrModule(mode);
        console.log(`--- ${i+1}. ${mode} ---\n`);
        await cvocr.init(2, 1);
        let ans = await cvocr.recognize(path.join(__dirname, "codes", mode, "example.jpg"));
        console.log("ans:", ans)
        console.log("\n");
    }
    process.exit(0);
})()