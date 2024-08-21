"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//
function compact(obj) {
    if (Array.isArray(obj)) {
        return obj.filter(val => ![undefined, null].includes(val));
    }
    else {
        return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null));
    }
}
exports.default = compact;
// const x = compact(['a', 2, null, undefined])
// const y = compact({ a: 1, b: 'b', c: null, d: undefined })
