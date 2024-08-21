"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allNestedObjectKeys = void 0;
const typechecks_1 = require("./typechecks");
function allNestedObjectKeys(obj) {
    return Object.keys(obj).flatMap(key => {
        const next = obj[key];
        if ((0, typechecks_1.isObject)(next))
            return [key, allNestedObjectKeys(next)].flat();
        return [key];
    });
}
exports.allNestedObjectKeys = allNestedObjectKeys;
