"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ops_1 = __importDefault(require("../../../ops"));
const getColumnForSortableScope_1 = __importDefault(require("./getColumnForSortableScope"));
const scopeArray_1 = __importDefault(require("./scopeArray"));
async function decrementPositionForScopedRecordsGreaterThanPosition(position, { dream, positionField, query, scope, }) {
    let kyselyQuery = query
        .whereNot({ [dream.primaryKey]: dream.primaryKeyValue })
        .where({
        [positionField]: ops_1.default.greaterThanOrEqualTo(position),
    })
        .toKysely('update')
        .set((eb) => {
        return {
            [positionField]: eb(positionField, '-', 1),
        };
    });
    for (const singleScope of (0, scopeArray_1.default)(scope)) {
        const column = (0, getColumnForSortableScope_1.default)(dream, singleScope);
        if (column) {
            kyselyQuery = kyselyQuery.where(column, '=', dream[column]);
        }
    }
    await kyselyQuery.execute();
}
exports.default = decrementPositionForScopedRecordsGreaterThanPosition;
