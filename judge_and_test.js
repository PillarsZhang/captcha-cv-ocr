const path = require("path");
const fs = require("fs");
const cvocrModule = require(".");

//Debug等级
global.debugFlag = 1;

//验证码种类与各自的评估函数
var modeList = {
    "simplest" : (ans, rightAns) => ans.result == rightAns,
    "grids_and_equations" : (ans, rightAns) => ans.equation.slice(0, 3) == rightAns,
};

(async () => {
    var modeI = 0;
    for(let mode in modeList){
        let cvocr = new cvocrModule(mode);
        console.log(`--- ${++modeI}. ${mode} ---\n`);
        await cvocr.init(2, 1);

        let examplePath = path.join(__dirname, "codes", mode, "examples");
        let files = fs.readdirSync(examplePath);
        var rightNum = 0;
        for(let i = 0; i < files.length; i++){
            let rightAns = files[i].slice(0, - path.extname(files[i]).length);
            let ans = await cvocr.recognize(path.join(examplePath, files[i]));
            let judge = modeList[mode](ans, rightAns);
            if (judge) rightNum++;
            console.log("ans:", ans)
            console.log(judge ? "Right!" : `Wrong! | the rightAns is : ${rightAns}`, "\n");
        }
        console.log(`${mode}'s score: ${(rightNum/files.length*100).toFixed(1)}% (${rightNum}/${files.length})\n`);
    }
    process.exit(0);
})()