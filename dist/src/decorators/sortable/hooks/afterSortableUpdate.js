"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const clearCachedSortableValues_1 = __importDefault(require("../helpers/clearCachedSortableValues"));
const setPosition_1 = __importDefault(require("../helpers/setPosition"));
const sortableCacheKeyName_1 = __importDefault(require("../helpers/sortableCacheKeyName"));
const sortableCacheValuesName_1 = __importDefault(require("../helpers/sortableCacheValuesName"));
async function afterUpdateSortable({ positionField, dream, query, txn, scope, }) {
    const cacheKey = (0, sortableCacheKeyName_1.default)(positionField);
    const cachedValuesName = (0, sortableCacheValuesName_1.default)(positionField);
    if (!dream[cacheKey])
        return;
    if (dream[cachedValuesName]) {
        await (0, setPosition_1.default)({
            ...dream[cachedValuesName],
            txn,
        });
    }
    else {
        await (0, setPosition_1.default)({
            position: dream[cacheKey],
            dream: dream,
            positionField,
            scope,
            previousPosition: dream.changes()[positionField]?.was,
            query,
            txn,
        });
    }
    (0, clearCachedSortableValues_1.default)(dream, positionField);
}
exports.default = afterUpdateSortable;
