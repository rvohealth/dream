import Dream from '../../../Dream'
import DreamTransaction from '../../../dream/DreamTransaction'
import Query from '../../../dream/Query'
import clearCachedSortableValues from '../helpers/clearCachedSortableValues'
import setPosition from '../helpers/setPosition'
import sortableCacheKeyName from '../helpers/sortableCacheKeyName'
import sortableCacheValuesName from '../helpers/sortableCacheValuesName'

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
  txn?: DreamTransaction<any>
  scope?: string | string[]
}) {
  const cacheKey = sortableCacheKeyName(positionField)
  const cachedValuesName = sortableCacheValuesName(positionField)

  if (!(dream as any)[cacheKey]) return
  if ((dream as any)[cachedValuesName]) {
    await setPosition({
      ...(dream as any)[cachedValuesName],
      txn,
    })
  } else {
    await setPosition({
      position: (dream as any)[cacheKey],
      dream: dream,
      positionField,
      scope,
      previousPosition: dream.changes()[positionField]?.was,
      query,
      txn,
    })
  }

  clearCachedSortableValues(dream, positionField)
}
