"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function shouldBypassDefaultScope(scopeName, { bypassAllDefaultScopes = false, defaultScopesToBypass, }) {
    if (bypassAllDefaultScopes)
        return true;
    if (!defaultScopesToBypass.length)
        return false;
    if (defaultScopesToBypass.includes(scopeName))
        return true;
    return false;
}
exports.default = shouldBypassDefaultScope;
