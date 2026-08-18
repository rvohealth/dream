import Dream from '../../../../Dream.js'
import DreamTransaction from '../../../../dream/DreamTransaction.js'
import Query from '../../../../dream/Query.js'
import clearCachedSortableValues from '../helpers/clearCachedSortableValues.js'
import decrementPositionForScopedRecordsGreaterThanPosition from '../helpers/decrementScopedRecordsGreaterThanPosition.js'
import { invalidateSortableRowCache } from '../helpers/sortableRowCache.js'
import { clearSortableSnapshot, sortableSnapshotFor } from '../helpers/sortableSnapshot.js'

export default async function afterSortableDestroy({
  positionField,
  dream,
  query,
  scope,
  txn,
}: {
  positionField: string
  dream: Dream
  query: Query<Dream>
  scope: string | string[] | undefined
  txn: DreamTransaction<any>
}) {
  // The row's real position and scope, read by the destroy's preparation phase
  // (`prepareSortableFieldsForDestroy`) while the row still existed. The
  // instance's own position is whatever it held when
  // it was loaded, which is too low as soon as another create or update moved
  // the record down — and shifting from a position lower than the vacated one
  // moves rows onto occupied positions rather than closing the gap.
  const snapshot = sortableSnapshotFor(dream, positionField)
  const position = snapshot ? snapshot.position : (dream as any)[positionField]

  if (position !== null && position !== undefined) {
    await decrementPositionForScopedRecordsGreaterThanPosition(position, {
      dream,
      positionField,
      scope,
      query,
      snapshot,
    })

    // every surviving row above the vacancy just moved, which includes rows a
    // locked batch's preflight read for the records it has yet to walk
    invalidateSortableRowCache(txn)
  }

  clearCachedSortableValues(dream, positionField)
  clearSortableSnapshot(dream, positionField)
}
