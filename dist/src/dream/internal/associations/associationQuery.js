"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const applyScopeBypassingSettingsToQuery_1 = __importDefault(require("../applyScopeBypassingSettingsToQuery"));
function associationQuery(dream, txn = null, associationName, { associationWhereStatement, bypassAllDefaultScopes, defaultScopesToBypass, }) {
    const association = dream['associationMetadataMap']()[associationName];
    const associationClass = association.modelCB();
    const dreamClass = dream.constructor;
    const dreamClassOrTransaction = (txn ? dreamClass.txn(txn) : dreamClass);
    let baseSelectQuery = dreamClassOrTransaction.where({ [dream.primaryKey]: dream.primaryKeyValue });
    if (associationWhereStatement)
        baseSelectQuery = baseSelectQuery.joins(association.as, associationWhereStatement);
    else
        baseSelectQuery = baseSelectQuery.joins(association.as);
    let query = txn ? associationClass.txn(txn).queryInstance() : associationClass.query();
    query = (0, applyScopeBypassingSettingsToQuery_1.default)(query, {
        bypassAllDefaultScopes,
        defaultScopesToBypass,
    });
    return query['setBaseSQLAlias'](association.as)['setAssociationQueryBase'](baseSelectQuery);
}
exports.default = associationQuery;
