const { createWorker, createScheduler } = require('tesseract.js');
const scheduler = createScheduler();

class tesseract_ocr {
    constructor(workers) {
        this.workersNum = workers
    };
    init = async () => {
        for (var i = 0; i < this.workersNum; i++) {
            const worker = createWorker();
            await worker.load();
            await worker.loadLanguage('eng');
            await worker.initialize('eng');
            await worker.setParameters({
                tessedit_char_whitelist: '0123456789',
                tessedit_pageseg_mode: '7',
            });
            scheduler.addWorker(worker);
            console.log(`${i + 1}/${this.workersNum} worker(s) initalized`);
        }
    };
    recognize = async (image) => {
        var timeBegin = Date.now();
        const { data: { text } } = await scheduler.addJob('recognize', image);
        return { result: text.replace("\n", ""), time: Date.now() - timeBegin };
    };
    terminate = async () => {
        await scheduler.terminate();
    };
    getQueueLen = async () => {
        var len = await scheduler.getQueueLen();
        return len;
    };
}

module.exports = tesseract_ocr;
