"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Range = void 0;
function range(begin, end = null, excludeEnd = false) {
    return new Range(begin, end, excludeEnd);
}
exports.default = range;
class Range {
    constructor(begin, end = null, excludeEnd = false) {
        if (!begin && !end)
            throw `
        Must pass either begin or end to a date range
      `;
        this.begin = begin;
        this.end = end;
        this.excludeEnd = excludeEnd;
    }
}
exports.Range = Range;
