"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const clearCachedSortableValues_1 = __importDefault(require("../helpers/clearCachedSortableValues"));
const setPosition_1 = __importDefault(require("../helpers/setPosition"));
const sortableCacheKeyName_1 = __importDefault(require("../helpers/sortableCacheKeyName"));
async function afterSortableCreate({ positionField, dream, query, txn, scope, }) {
    const cacheKey = (0, sortableCacheKeyName_1.default)(positionField);
    await (0, setPosition_1.default)({
        position: dream[cacheKey],
        dream,
        positionField,
        txn,
        scope,
        query,
    });
    (0, clearCachedSortableValues_1.default)(dream, positionField);
}
exports.default = afterSortableCreate;
