"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isDateColumn(dreamClass, column) {
    return dreamClass['cachedTypeFor'](column) === 'date';
}
exports.default = isDateColumn;
