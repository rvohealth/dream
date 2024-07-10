import Dream from '../../dream'
import DreamTransaction from '../transaction'

/**
 * @internal
 *
 * Destroys all HasOne/HasMany associations on this
 * dream that are marked as `dependent: 'destroy'`
 */
export default async function destroyAssociatedRecords<I extends Dream>(
  dream: I,
  txn: DreamTransaction<I>,
  { skipHooks, reallyDestroy }: { skipHooks: boolean; reallyDestroy: boolean }
) {
  const dreamClass = dream.constructor as typeof Dream

  for (const associationName of dreamClass['dependentDestroyAssociationNames']()) {
    if (reallyDestroy) {
      await dream.txn(txn).reallyDestroyAssociation(associationName as any, { skipHooks, cascade: true })
    } else {
      await dream.txn(txn).destroyAssociation(associationName as any, { skipHooks, cascade: true })
    }
  }
}
