"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reallyDestroyOptions = exports.undestroyOptions = exports.destroyOptions = void 0;
const scopeHelpers_1 = require("./scopeHelpers");
function baseDestroyOptions({ bypassAllDefaultScopes, defaultScopesToBypass, cascade, skipHooks, } = {}) {
    return {
        bypassAllDefaultScopes: bypassAllDefaultScopes ?? scopeHelpers_1.DEFAULT_BYPASS_ALL_DEFAULT_SCOPES,
        defaultScopesToBypass: defaultScopesToBypass ?? scopeHelpers_1.DEFAULT_DEFAULT_SCOPES_TO_BYPASS,
        cascade: cascade ?? scopeHelpers_1.DEFAULT_CASCADE,
        skipHooks: skipHooks ?? scopeHelpers_1.DEFAULT_SKIP_HOOKS,
    };
}
function destroyOptions(options) {
    return {
        ...baseDestroyOptions(options),
        reallyDestroy: false,
    };
}
exports.destroyOptions = destroyOptions;
function undestroyOptions(options) {
    return {
        ...baseDestroyOptions(options),
        defaultScopesToBypass: (0, scopeHelpers_1.addSoftDeleteScopeToUserScopes)(options?.defaultScopesToBypass),
    };
}
exports.undestroyOptions = undestroyOptions;
function reallyDestroyOptions(options) {
    return {
        ...undestroyOptions(options),
        reallyDestroy: true,
    };
}
exports.reallyDestroyOptions = reallyDestroyOptions;
