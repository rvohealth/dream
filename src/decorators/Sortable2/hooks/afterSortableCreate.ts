import Dream from '../../../Dream2'
import DreamTransaction from '../../../dream/DreamTransaction'
import Query from '../../../dream/Query2'
import clearCachedSortableValues from '../helpers/clearCachedSortableValues'
import setPosition from '../helpers/setPosition'
import sortableCacheKeyName from '../helpers/sortableCacheKeyName'

export default async function afterSortableCreate({
  positionField,
  dream,
  query,
  txn,
  scope,
}: {
  positionField: string
  dream: Dream
  query: Query<Dream>
  txn?: DreamTransaction<any>
  scope?: string | string[]
}) {
  const cacheKey = sortableCacheKeyName(positionField)

  await setPosition({
    position: (dream as any)[cacheKey],
    dream,
    positionField,
    txn,
    scope,
    query,
  })

  clearCachedSortableValues(dream, positionField)
}
