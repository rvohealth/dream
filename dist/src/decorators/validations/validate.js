"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function Validate() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return function (target, key, _) {
        const t = target.constructor;
        if (!Object.getOwnPropertyDescriptor(t, 'customValidations'))
            t['customValidations'] = [...(t['customValidations'] || [])];
        t['customValidations'].push(key);
    };
}
exports.default = Validate;
