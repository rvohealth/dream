"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isDatabaseArrayColumn(dreamClass, column) {
    return /\[\]$/.test(dreamClass['cachedTypeFor'](column));
}
exports.default = isDatabaseArrayColumn;
