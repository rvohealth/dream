"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_uniq_1 = __importDefault(require("lodash.uniq"));
const lodash_uniqwith_1 = __importDefault(require("lodash.uniqwith"));
function uniq(arr, comparator = undefined) {
    if (comparator)
        return (0, lodash_uniqwith_1.default)(arr, comparator);
    else if (arr[0]?.isDreamInstance)
        return (0, lodash_uniqwith_1.default)(arr, dreamComparator);
    else
        return (0, lodash_uniq_1.default)(arr);
}
exports.default = uniq;
function dreamComparator(a, b) {
    return a.equals(b);
}
