"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const applyScopeBypassingSettingsToQuery_1 = __importDefault(require("../applyScopeBypassingSettingsToQuery"));
function associationUpdateQuery(dream, txn = null, associationName, { associationWhereStatement, bypassAllDefaultScopes, defaultScopesToBypass, }) {
    const association = dream['associationMetadataMap']()[associationName];
    const associationClass = association.modelCB();
    if (Array.isArray(associationClass)) {
        throw new Error('Cannot update a polymorphic association using associationUpdateQuery');
    }
    const dreamClass = dream.constructor;
    let nestedScope = txn ? dreamClass.txn(txn) : dreamClass.query();
    nestedScope = (0, applyScopeBypassingSettingsToQuery_1.default)(nestedScope, {
        bypassAllDefaultScopes,
        defaultScopesToBypass,
    });
    if (associationWhereStatement)
        nestedScope = nestedScope.joins(association.as, associationWhereStatement);
    else
        nestedScope = nestedScope.joins(association.as);
    const nestedSelect = nestedScope
        .where({ [dream.primaryKey]: dream.primaryKeyValue })
        .nestedSelect(`${association.as}.${associationClass.primaryKey}`);
    const whereClause = {
        [associationClass.primaryKey]: nestedSelect,
    };
    let query = txn ? associationClass.txn(txn).where(whereClause) : associationClass.where(whereClause);
    query = (0, applyScopeBypassingSettingsToQuery_1.default)(query, {
        bypassAllDefaultScopes,
        defaultScopesToBypass,
    });
    return query;
}
exports.default = associationUpdateQuery;
