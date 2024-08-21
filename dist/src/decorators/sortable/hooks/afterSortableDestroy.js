"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const clearCachedSortableValues_1 = __importDefault(require("../helpers/clearCachedSortableValues"));
const decrementScopedRecordsGreaterThanPosition_1 = __importDefault(require("../helpers/decrementScopedRecordsGreaterThanPosition"));
async function afterSortableDestroy({ positionField, dream, query, scope, }) {
    await (0, decrementScopedRecordsGreaterThanPosition_1.default)(dream[positionField], {
        dream,
        positionField,
        scope,
        query,
    });
    (0, clearCachedSortableValues_1.default)(dream, positionField);
}
exports.default = afterSortableDestroy;
