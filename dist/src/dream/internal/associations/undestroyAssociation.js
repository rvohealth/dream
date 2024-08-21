"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const associationUpdateQuery_1 = __importDefault(require("./associationUpdateQuery"));
async function undestroyAssociation(dream, txn = null, associationName, { associationWhereStatement, bypassAllDefaultScopes, defaultScopesToBypass, cascade, skipHooks, }) {
    const query = (0, associationUpdateQuery_1.default)(dream, txn, associationName, {
        associationWhereStatement,
        bypassAllDefaultScopes,
        defaultScopesToBypass,
    });
    return await query.undestroy({ skipHooks, cascade });
}
exports.default = undestroyAssociation;
