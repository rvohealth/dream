"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isDecimalColumn(dreamClass, column) {
    return dreamClass['cachedTypeFor'](column) === 'numeric';
}
exports.default = isDecimalColumn;
