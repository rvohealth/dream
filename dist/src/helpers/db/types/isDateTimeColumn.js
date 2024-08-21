"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isDateTimeColumn(dreamClass, column) {
    return !!dreamClass['cachedTypeFor'](column)?.includes('timestamp');
}
exports.default = isDateTimeColumn;
