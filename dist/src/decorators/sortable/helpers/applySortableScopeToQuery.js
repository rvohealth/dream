"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getColumnForSortableScope_1 = __importDefault(require("./getColumnForSortableScope"));
const scopeArray_1 = __importDefault(require("./scopeArray"));
function applySortableScopeToQuery(query, dream, scope) {
    if (!scope)
        return query;
    const scopes = (0, scopeArray_1.default)(scope);
    for (const scope of scopes) {
        const column = (0, getColumnForSortableScope_1.default)(dream, scope);
        query = query.where({
            [column]: dream[column],
        });
    }
    return query;
}
exports.default = applySortableScopeToQuery;
