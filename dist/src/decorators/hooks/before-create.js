"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("./shared");
function BeforeCreate(opts = {}) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return function (target, key, _) {
        const dreamClass = target.constructor;
        if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
            dreamClass['hooks'] = (0, shared_1.blankHooksFactory)(dreamClass);
        const hookStatement = {
            className: dreamClass.name,
            method: key,
            type: 'beforeCreate',
            ifChanging: opts.ifChanging,
        };
        dreamClass['addHook']('beforeCreate', hookStatement);
    };
}
exports.default = BeforeCreate;
