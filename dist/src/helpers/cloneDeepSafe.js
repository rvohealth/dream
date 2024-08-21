"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_clonedeepwith_1 = __importDefault(require("lodash.clonedeepwith"));
/**
 * @internal
 *
 * accepts any value, and will return a valid clone of
 * that object. Any dream or query instances passed
 * will automatically be cloned using special cloning
 * methods.
 *
 * @param original - the value to clone
 * @param includePrimaryKey - Whether or not to copy the primary key when cloning a dream instance
 * @returns Either a clone, or else the original value
 */
function cloneDeepSafe(original) {
    return (0, lodash_clonedeepwith_1.default)(original, (value) => {
        if (value?.isDreamInstance)
            return value['clone']();
        if (value?.isDreamQuery)
            return value.clone();
        if (value?.isSelectQueryBuilder)
            return value;
    });
}
exports.default = cloneDeepSafe;
