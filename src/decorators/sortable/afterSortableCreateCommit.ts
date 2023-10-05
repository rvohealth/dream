import Dream from '../../dream'
import Query from '../../dream/query'
import clearCachedSortableValues from './clearCachedSortableValues'
import setPosition from './setPosition'
import sortableCacheKeyName from './sortableCacheKeyName'

export default async function afterSortableCreateCommit({
  positionField,
  dream,
  query,
  scope,
}: {
  positionField: string
  dream: Dream
  query: Query<typeof Dream>
  scope?: string
}) {
  const cacheKey = sortableCacheKeyName(positionField)

  await setPosition({
    position: (dream as any)[cacheKey],
    dream,
    positionField,
    scope,
    previousPosition: dream.changes()[positionField]?.was,
    query,
  })

  clearCachedSortableValues(dream, positionField)
}
