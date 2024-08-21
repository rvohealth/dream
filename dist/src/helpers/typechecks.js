"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isObject = exports.isString = void 0;
function isString(x) {
    return typeof x === 'string' || x instanceof String;
}
exports.isString = isString;
function isObject(x) {
    if (x === null)
        return false;
    if (isString(x))
        return false;
    if (Array.isArray(x))
        return false;
    return typeof x === 'object';
}
exports.isObject = isObject;
