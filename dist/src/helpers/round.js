"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function round(num, precision = 0) {
    const multiplier = Math.pow(10, precision) || 1;
    return Math.round(num * multiplier) / multiplier;
}
exports.default = round;
