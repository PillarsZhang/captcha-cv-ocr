const { createWorker, createScheduler } = require('tesseract.js');

const numberScheduler = createScheduler();
const symbolScheduler = createScheduler();

class tesseract_ocr {
    constructor(numberWorkers = 1, symbolWorkers = 1) {
        this.numberWorkersNum = numberWorkers;
        this.symbolWorkersNum = symbolWorkers;
        this.workersNum = numberWorkers + symbolWorkers;
    }
    init = async () => {
        for (var i = 0; i < this.numberWorkersNum; i++) {
            const worker = createWorker();
            await worker.load();
            await worker.loadLanguage('eng');
            await worker.initialize('eng');
            await worker.setParameters({
                tessedit_char_whitelist: '0123456789',
                tessedit_pageseg_mode: '10',
            });
            numberScheduler.addWorker(worker);
            console.log(`${i + 1}/${this.workersNum} worker(s) initalized`);
        }
        for (var i = 0; i < this.symbolWorkersNum; i++) {
            const worker = createWorker();
            await worker.load();
            await worker.loadLanguage('eng');
            await worker.initialize('eng');
            await worker.setParameters({
                tessedit_char_whitelist: '+x',
                tessedit_pageseg_mode: '10',
            });
            symbolScheduler.addWorker(worker);
            console.log(`${i + 1 + this.numberWorkersNum}/${this.workersNum} worker(s) initalized`);
        }
    };
    recognize = async (image, type) => {
        var timeBegin = Date.now();
        let ocrResult;
        if (type == 'number') { ocrResult = await numberScheduler.addJob('recognize', image); }
        if (type == 'symbol') { ocrResult = await symbolScheduler.addJob('recognize', image); }
        return { result: ocrResult.data.text.replace("\n", ""), time: Date.now() - timeBegin };
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
