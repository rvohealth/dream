"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pascalize_1 = __importDefault(require("../../../helpers/pascalize"));
function sortableCacheValuesName(positionField) {
    return `_cachedPositionValuesFor${(0, pascalize_1.default)(positionField)}`;
}
exports.default = sortableCacheValuesName;
