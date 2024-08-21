"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isSortedCorrectly(arr, positionField) {
    const invalidPositionItem = arr.find((item, index) => item[positionField] !== index + 1);
    return !invalidPositionItem;
}
exports.default = isSortedCorrectly;
