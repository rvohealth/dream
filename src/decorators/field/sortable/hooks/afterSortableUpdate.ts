import Dream from '../../../../Dream.js'
import DreamTransaction from '../../../../dream/DreamTransaction.js'
import Query from '../../../../dream/Query.js'
import clearCachedSortableValues from '../helpers/clearCachedSortableValues.js'
import setPosition from '../helpers/setPosition.js'
import sortableCacheValuesName from '../helpers/sortableCacheValuesName.js'
import { SortableCache } from './beforeSortableSave.js'

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
  txn?: DreamTransaction<any> | undefined
  scope: string | string[] | undefined
}) {
  const cachedValuesName = sortableCacheValuesName(positionField)
  const sortableCache: SortableCache = (dream as any)[cachedValuesName]

  if (!sortableCache) return

  await setPosition({
    ...sortableCache,
    dream,
    positionField,
    position: sortableCache.changingScope ? undefined : sortableCache.position,
    query,
    scope,
    txn,
  })

  clearCachedSortableValues(dream, positionField)
}
