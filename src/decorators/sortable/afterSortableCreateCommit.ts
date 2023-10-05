import Dream from '../../dream'
import Query from '../../dream/query'
import clearCachedSortableValues from './clearCachedSortableValues'
import setPosition from './setPosition'

export default async function afterSortableCreateCommit({
  positionField,
  dream,
  query,
  cacheKey,
  cachedValuesName,
  scope,
}: {
  positionField: string
  dream: Dream
  cacheKey: string
  cachedValuesName: string
  query: Query<typeof Dream>
  scope?: string
}) {
  await setPosition({
    position: (dream as any)[cacheKey],
    dream,
    positionField,
    scope,
    previousPosition: dream.changes()[positionField]?.was,
    query,
  })

  clearCachedSortableValues(dream, cacheKey, cachedValuesName)
}
