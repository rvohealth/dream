"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sortableCacheKeyName_1 = __importDefault(require("./sortableCacheKeyName"));
const sortableCacheValuesName_1 = __importDefault(require("./sortableCacheValuesName"));
function clearCachedSortableValues(dream, positionField) {
    const cacheKey = (0, sortableCacheKeyName_1.default)(positionField);
    const cachedValuesName = (0, sortableCacheValuesName_1.default)(positionField);
    dream[cacheKey] = undefined;
    dream[cachedValuesName] = undefined;
}
exports.default = clearCachedSortableValues;
