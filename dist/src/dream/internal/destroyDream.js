"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const destroyAssociatedRecords_1 = __importDefault(require("./destroyAssociatedRecords"));
const runHooksFor_1 = __importDefault(require("./runHooksFor"));
const safelyRunCommitHooks_1 = __importDefault(require("./safelyRunCommitHooks"));
const softDeleteDream_1 = __importDefault(require("./softDeleteDream"));
/**
 * @internal
 *
 * Destroys the Dream and any `dependent: 'destroy'` associations
 * within a transaction. If a transaction is passed, it will be used.
 * Otherwise, a new transaction will be created automatically.
 * If any of the nested associations fails to destroy, then this
 * record will also fail to destroy. If skipHooks is true, model hooks
 * will be bypassed.
 */
async function destroyDream(dream, txn = null, options) {
    if (txn) {
        return await destroyDreamWithTransaction(dream, txn, options);
    }
    else {
        const dreamClass = dream.constructor;
        return await dreamClass.transaction(async (txn) => await destroyDreamWithTransaction(dream, txn, options));
    }
}
exports.default = destroyDream;
/**
 * @internal
 *
 * Given a transaction, applies the destroy query,
 * including cascading to child associations and
 * model hooks.
 */
async function destroyDreamWithTransaction(dream, txn, options) {
    const { cascade, reallyDestroy, skipHooks } = options;
    if (cascade) {
        await (0, destroyAssociatedRecords_1.default)(dream, txn, options);
    }
    if (!skipHooks) {
        await (0, runHooksFor_1.default)('beforeDestroy', dream, true, null, txn);
    }
    await maybeDestroyDream(dream, txn, reallyDestroy);
    if (!skipHooks) {
        await (0, runHooksFor_1.default)('afterDestroy', dream, true, null, txn || undefined);
        await (0, safelyRunCommitHooks_1.default)(dream, 'afterDestroyCommit', true, null, txn);
    }
    if (shouldSoftDelete(dream, reallyDestroy)) {
        await dream.txn(txn).reload();
    }
    return dream;
}
function shouldSoftDelete(dream, reallyDestroy) {
    const dreamClass = dream.constructor;
    return dreamClass['softDelete'] && !reallyDestroy;
}
/**
 * @internal
 *
 * Destroys the dream iff it was not blocked from
 * deleting by one of the beforeDestroy model hooks
 */
async function maybeDestroyDream(dream, txn, reallyDestroy) {
    if (shouldSoftDelete(dream, reallyDestroy)) {
        await (0, softDeleteDream_1.default)(dream, txn);
    }
    else if (!dream['_preventDeletion']) {
        await txn.kyselyTransaction
            .deleteFrom(dream.table)
            .where(dream.primaryKey, '=', dream.primaryKeyValue)
            .execute();
    }
}
