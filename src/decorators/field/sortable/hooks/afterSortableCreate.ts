import Dream from '../../../../Dream.js'
import DreamTransaction from '../../../../dream/DreamTransaction.js'
import Query from '../../../../dream/Query.js'
import clearCachedSortableValues from '../helpers/clearCachedSortableValues.js'
import setPosition from '../helpers/setPosition.js'
import sortableCacheKeyName from '../helpers/sortableCacheKeyName.js'

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
  txn?: DreamTransaction<any> | undefined
  scope?: string | string[] | undefined
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
