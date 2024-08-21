"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @internal
 *
 * Destroys all HasOne/HasMany associations on this
 * dream that are marked as `dependent: 'destroy'`
 */
async function destroyAssociatedRecords(dream, txn, options) {
    const dreamClass = dream.constructor;
    const { reallyDestroy } = options;
    for (const associationName of dreamClass['dependentDestroyAssociationNames']()) {
        if (reallyDestroy) {
            await dream.txn(txn).reallyDestroyAssociation(associationName, options);
        }
        else {
            await dream.txn(txn).destroyAssociation(associationName, options);
        }
    }
}
exports.default = destroyAssociatedRecords;
