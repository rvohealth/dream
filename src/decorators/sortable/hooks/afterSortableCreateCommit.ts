import Dream from '../../../dream'
import Query from '../../../dream/query'
import clearCachedSortableValues from '../helpers/clearCachedSortableValues'
import setPosition from '../helpers/setPosition'
import sortableCacheKeyName from '../helpers/sortableCacheKeyName'

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
    query,
  })

  clearCachedSortableValues(dream, positionField)
}
