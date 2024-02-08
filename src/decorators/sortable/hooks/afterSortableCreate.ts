import Dream from '../../../dream'
import Query from '../../../dream/query'
import DreamTransaction from '../../../dream/transaction'
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
  query: Query<typeof Dream>
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
