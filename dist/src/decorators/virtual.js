"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function Virtual(type) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return function (target, key, _) {
        const t = target.constructor;
        if (!Object.getOwnPropertyDescriptor(t, 'virtualAttributes'))
            t['virtualAttributes'] = [...(t['virtualAttributes'] || [])];
        t['virtualAttributes'].push({
            property: key,
            type,
        });
    };
}
exports.default = Virtual;
