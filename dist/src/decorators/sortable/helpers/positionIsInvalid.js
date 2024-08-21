"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const applySortableScopeToQuery_1 = __importDefault(require("./applySortableScopeToQuery"));
async function positionIsInvalid({ query, dream, position, scope, }) {
    const totalRecordsQuery = (0, applySortableScopeToQuery_1.default)(query, dream, scope);
    return (position === null ||
        position === undefined ||
        position < 1 ||
        position > (await totalRecordsQuery.count()) + (dream.isPersisted ? 0 : 1));
}
exports.default = positionIsInvalid;
