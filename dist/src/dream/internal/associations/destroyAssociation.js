"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const associationUpdateQuery_1 = __importDefault(require("./associationUpdateQuery"));
async function destroyAssociation(dream, txn = null, associationName, { associationWhereStatement, bypassAllDefaultScopes, defaultScopesToBypass, cascade, reallyDestroy, skipHooks, }) {
    const query = (0, associationUpdateQuery_1.default)(dream, txn, associationName, {
        associationWhereStatement,
        bypassAllDefaultScopes,
        defaultScopesToBypass,
    });
    if (reallyDestroy) {
        return await query.reallyDestroy({ skipHooks, cascade });
    }
    else {
        return await query.destroy({ skipHooks, cascade });
    }
}
exports.default = destroyAssociation;
