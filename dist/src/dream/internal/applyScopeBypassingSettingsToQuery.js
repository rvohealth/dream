"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function applyScopeBypassingSettingsToQuery(query, { bypassAllDefaultScopes, defaultScopesToBypass, }) {
    if (bypassAllDefaultScopes)
        query = query.removeAllDefaultScopes();
    defaultScopesToBypass.forEach(defaultScopeToBypass => {
        query = query.removeDefaultScope(defaultScopeToBypass);
    });
    return query;
}
exports.default = applyScopeBypassingSettingsToQuery;
