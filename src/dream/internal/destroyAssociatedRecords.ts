import Dream from '../../Dream.js'
import DreamTransaction from '../DreamTransaction.js'
import { ReallyDestroyOptions } from './destroyDream.js'

/**
 * @internal
 *
 * Destroys all HasOne/HasMany associations on this
 * dream that are marked as `dependent: 'destroy'`.
 *
 * Expects associations to be preloaded onto the dream instance
 * via `loadDependentDestroyTree`. Iterates loaded associations
 * directly instead of querying the database.
 */
export default async function destroyAssociatedRecords<I extends Dream>(
  dream: I,
  txn: DreamTransaction<I>,
  options: ReallyDestroyOptions<I>
) {
  const dreamClass = dream.constructor as typeof Dream
  const { reallyDestroy } = options

  for (const associationName of dreamClass['dependentDestroyAssociationNames']()) {
    const loaded = (dream as any)[associationName]
    const records: Dream[] = Array.isArray(loaded) ? loaded : loaded ? [loaded] : []

    for (const record of records) {
      if (reallyDestroy) {
        await (record as any).txn(txn).reallyDestroy(options)
      } else {
        await (record as any).txn(txn).destroy(options)
      }
    }
  }
}
