const path = require("path");
const cvocrModule = require("captcha-cv-ocr");

var mode = "simplest";

(async () => {
    let cvocr = new cvocrModule(mode);  // mode 表示验证码的种类
    await cvocr.init(1);  //其中的1表示需要启动的 OCR Worker 数（多线程）
    let ans = await cvocr.recognize(path.join(__dirname, "docs/img", mode + ".jpg"));  //支持文件地址、Base64、Buffer形式
    console.log("ans:", ans)
    process.exit(0);
})()