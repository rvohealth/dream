"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
class Benchmark {
    start() {
        this._start = luxon_1.DateTime.now();
    }
    mark(message, level = 'log') {
        if (process.env.NODE_ENV === 'test' && process.env.ALLOW_BENCHMARKS !== '1')
            return;
        if (!this._start)
            this.start();
        console[level](message, luxon_1.DateTime.now().diff(this._start, 'milliseconds').milliseconds);
    }
}
exports.default = Benchmark;
