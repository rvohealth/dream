"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const setPosition_1 = require("../../decorators/sortable/helpers/setPosition");
const runHooksFor_1 = __importDefault(require("./runHooksFor"));
const safelyRunCommitHooks_1 = __importDefault(require("./safelyRunCommitHooks"));
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
async function undestroyDream(dream, txn = null, options) {
    if (txn) {
        return await undestroyDreamWithTransaction(dream, txn, options);
    }
    else {
        const dreamClass = dream.constructor;
        return await dreamClass.transaction(async (txn) => await undestroyDreamWithTransaction(dream, txn, options));
    }
}
exports.default = undestroyDream;
/**
 * @internal
 *
 * Given a transaction, applies the destroy query,
 * including cascading to child associations and
 * model hooks.
 */
async function undestroyDreamWithTransaction(dream, txn, options) {
    const { cascade, skipHooks } = options;
    if (!skipHooks) {
        await (0, runHooksFor_1.default)('beforeUpdate', dream, true, null, txn);
    }
    await doUndestroyDream(dream, txn);
    if (cascade) {
        await undestroyAssociatedRecords(dream, txn, options);
    }
    if (!skipHooks) {
        await (0, runHooksFor_1.default)('afterUpdate', dream, true, null, txn);
        await (0, safelyRunCommitHooks_1.default)(dream, 'afterUpdateCommit', true, null, txn);
    }
    await dream.txn(txn).reload();
    return dream;
}
/**
 * @internal
 *
 * Destroys the dream iff it was not blocked from
 * deleting by one of the beforeDestroy model hooks
 */
async function doUndestroyDream(dream, txn) {
    let query = txn.kyselyTransaction
        .updateTable(dream.table)
        .where(dream.primaryKey, '=', dream.primaryKeyValue)
        .set({ [dream.deletedAtField]: null });
    const dreamClass = dream.constructor;
    dreamClass['sortableFields']?.forEach(sortableFieldMetadata => {
        const positionColumn = sortableFieldMetadata.positionField;
        query = query.set(eb => ({
            [positionColumn]: eb((0, setPosition_1.applySortableScopesToQuery)(dream, txn.kyselyTransaction.selectFrom(dream.table), column => dream[column], sortableFieldMetadata.scope).select(eb => eb.fn.max(positionColumn).as(positionColumn + '_max')), '+', 1),
        }));
    });
    return await query.execute();
}
/**
 * @internal
 *
 * Destroys all HasOne/HasMany associations on this
 * dream that are marked as `dependent: 'destroy'`
 */
async function undestroyAssociatedRecords(dream, txn, options) {
    const dreamClass = dream.constructor;
    for (const associationName of dreamClass['dependentDestroyAssociationNames']()) {
        const associationMetadata = dreamClass['associationMetadataMap']()[associationName];
        const associatedClass = associationMetadata?.modelCB?.();
        if (Array.isArray(associatedClass)) {
            // TODO: decide how to handle polymorphic associations with dependent: destroy
            // raise?
        }
        else {
            if (associatedClass?.['softDelete']) {
                await dream.txn(txn).undestroyAssociation(associationName, options);
            }
        }
    }
}
