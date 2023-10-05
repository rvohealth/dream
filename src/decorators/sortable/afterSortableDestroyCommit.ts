import Dream from '../../dream'
import Query from '../../dream/query'
import clearCachedSortableValues from './clearCachedSortableValues'
import decrementPositionForScopedRecordsGreaterThanPosition from './decrementScopedRecordsGreaterThanPosition'
import setPosition from './setPosition'

export default async function afterSortableDestroyCommit({
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
  await decrementPositionForScopedRecordsGreaterThanPosition((dream as any)[positionField], {
    dream,
    positionField,
    scope,
    query,
  })
  clearCachedSortableValues(dream, cacheKey, cachedValuesName)
}
