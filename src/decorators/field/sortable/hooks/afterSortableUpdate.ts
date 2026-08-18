import Dream from '../../../../Dream.js'
import DreamTransaction from '../../../../dream/DreamTransaction.js'
import Query from '../../../../dream/Query.js'
import clearCachedSortableValues from '../helpers/clearCachedSortableValues.js'
import setPosition from '../helpers/setPosition.js'
import sortableCacheValuesName from '../helpers/sortableCacheValuesName.js'
import { clearSortableSnapshot, sortableSnapshotFor } from '../helpers/sortableSnapshot.js'
import { SortableCache } from '../helpers/prepareSortableFieldsForSave.js'

export default async function afterUpdateSortable({
  positionField,
  dream,
  query,
  txn,
  scope,
}: {
  positionField: string
  dream: Dream
  query: Query<Dream>
  txn: DreamTransaction<any>
  scope: string | string[] | undefined
}) {
  const cachedValuesName = sortableCacheValuesName(positionField)
  const sortableCache: SortableCache = (dream as any)[cachedValuesName]

  if (!sortableCache) return

  // The range this update compacts starts at the position the record really
  // held, which the `saveDream` sortable phase read from the row under the
  // scope lock. The instance's own memory of it is stale whenever another
  // writer moved the record after it was loaded, and shifting from a stale
  // position lands rows on occupied ones.
  const snapshot = sortableSnapshotFor(dream, positionField)

  await setPosition({
    ...sortableCache,
    dream,
    positionField,
    position: sortableCache.changingScope ? undefined : sortableCache.position,
    previousPosition: snapshot ? (snapshot.position ?? undefined) : sortableCache.previousPosition,
    snapshot,
    query,
    scope,
    txn,
  })

  clearCachedSortableValues(dream, positionField)
  clearSortableSnapshot(dream, positionField)
}
