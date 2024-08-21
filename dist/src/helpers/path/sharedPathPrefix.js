"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(a, b) {
    const maxLength = Math.max(a.length, b.length);
    let lastDelimiterIndex = 0;
    for (let i = 0; i < maxLength; i++) {
        if (a[i] !== b[i])
            return a.slice(0, lastDelimiterIndex);
        if (a[i] === '/')
            lastDelimiterIndex = i + 1;
    }
    return a;
}
exports.default = default_1;
