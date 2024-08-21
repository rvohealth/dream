"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("./shared");
/**
 * Calls the decorated method whenever a dream has finished
 * being destroyed. If the destroy takes place within a transaction,
 * this method will not be called until the transaction is
 * committed. However, if the destroy is not taking place in
 * a transaction, the method will be run after the save
 * is complete.
 *
 * class User extends ApplicationModel {
 *   @AfterDestroyCommit()
 *   public doSomething() {
 *     ...
 *   }
 * }
 */
function AfterDestroyCommit() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return function (target, key, _) {
        const dreamClass = target.constructor;
        if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
            dreamClass['hooks'] = (0, shared_1.blankHooksFactory)(dreamClass);
        const hookStatement = {
            className: dreamClass.name,
            method: key,
            type: 'afterDestroyCommit',
        };
        dreamClass['addHook']('afterDestroyCommit', hookStatement);
    };
}
exports.default = AfterDestroyCommit;
