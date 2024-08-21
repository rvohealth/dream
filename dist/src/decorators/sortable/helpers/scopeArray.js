"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function scopeArray(scope) {
    if (!scope)
        return [];
    if (Array.isArray(scope))
        return scope;
    return [scope];
}
exports.default = scopeArray;
