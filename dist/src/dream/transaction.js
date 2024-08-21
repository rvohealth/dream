"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const runHooksFor_1 = require("./internal/runHooksFor");
// though this class is called `DreamTransaction`, it is not itself
// a transaction class, as much as a collector for various callbacks
// that must be run after the underlying transaction is commited (i.e.
// AfterCreateCommit, AfterUpdateCommit, etc...).
class DreamTransaction {
    constructor() {
        this.commitHooks = [];
    }
    get kyselyTransaction() {
        return this._kyselyTransaction;
    }
    set kyselyTransaction(txn) {
        this._kyselyTransaction = txn;
    }
    addCommitHook(hookStatement, dreamInstance) {
        this.commitHooks.push({ dreamInstance, hookStatement });
    }
    async runAfterCommitHooks(txn) {
        for (const hook of this.commitHooks) {
            await (0, runHooksFor_1.runHook)(hook.hookStatement, hook.dreamInstance, txn);
        }
    }
}
exports.default = DreamTransaction;
