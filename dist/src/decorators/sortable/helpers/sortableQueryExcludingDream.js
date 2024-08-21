"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const applySortableScopeToQuery_1 = __importDefault(require("./applySortableScopeToQuery"));
function sortableQueryExcludingDream(dream, query, scope) {
    query = query.whereNot({
        [dream.primaryKey]: dream.primaryKeyValue,
    });
    return (0, applySortableScopeToQuery_1.default)(query, dream, scope);
}
exports.default = sortableQueryExcludingDream;
