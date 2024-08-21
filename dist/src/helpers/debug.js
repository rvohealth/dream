"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function debug(message, { level = 'log', } = {}) {
    if (process.env.NODE_ENV === 'test')
        return;
    if (process.env.DEBUG !== '1')
        return;
    console[level](message);
}
exports.default = debug;
