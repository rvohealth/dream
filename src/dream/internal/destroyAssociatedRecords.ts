import Dream from '../../Dream.js.js'
import DreamTransaction from '../DreamTransaction.js.js'
import { ReallyDestroyOptions } from './destroyDream.js.js'

/**
 * @internal
 *
 * Destroys all HasOne/HasMany associations on this
 * dream that are marked as `dependent: 'destroy'`
 */
export default async function destroyAssociatedRecords<I extends Dream>(
  dream: I,
  txn: DreamTransaction<I>,
  options: ReallyDestroyOptions<I>
) {
  const dreamClass = dream.constructor as typeof Dream

  const { reallyDestroy } = options

  for (const associationName of dreamClass['dependentDestroyAssociationNames']()) {
    if (reallyDestroy) {
      await dream.txn(txn).reallyDestroyAssociation(associationName as any, options)
    } else {
      await dream.txn(txn).destroyAssociation(associationName as any, options)
    }
  }
}
