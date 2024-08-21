"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isJsonColumn(dreamClass, column) {
    return ['json', 'jsonb'].includes(dreamClass['cachedTypeFor'](column));
}
exports.default = isJsonColumn;
