"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function Scope(opts = {}) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return function (target, key, _) {
        // target is already a typeof Dream here, because scopes
        // can only be set on static methods
        const t = target;
        const branch = opts.default ? 'default' : 'named';
        if (!Object.getOwnPropertyDescriptor(t, 'scopes'))
            t['scopes'] = {
                default: [...(t['scopes']?.default || [])],
                named: [...(t['scopes']?.named || [])],
            };
        const alreadyApplied = !!t['scopes'][branch].find(scope => scope.method === key);
        if (!alreadyApplied) {
            t['scopes'][branch].push({
                method: key,
                default: opts.default || false,
            });
        }
    };
}
exports.default = Scope;
