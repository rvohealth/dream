import Dream from '../../../dream'
import Query from '../../../dream/query'
import clearCachedSortableValues from '../helpers/clearCachedSortableValues'
import setPosition from '../helpers/setPosition'
import sortableCacheKeyName from '../helpers/sortableCacheKeyName'
import sortableCacheValuesName from '../helpers/sortableCacheValuesName'

export default async function afterUpdateSortableCommit({
  positionField,
  dream,
  query,
  scope,
}: {
  positionField: string
  dream: Dream
  query: Query<typeof Dream>
  scope?: string | string[]
}) {
  const cacheKey = sortableCacheKeyName(positionField)
  const cachedValuesName = sortableCacheValuesName(positionField)

  if (!(dream as any)[cacheKey]) return
  if ((dream as any)[cachedValuesName]) {
    await setPosition((dream as any)[cachedValuesName] as any)
  } else {
    await setPosition({
      position: (dream as any)[cacheKey],
      dream: dream,
      positionField,
      scope,
      previousPosition: dream.changes()[positionField]?.was,
      query,
    })
  }

  clearCachedSortableValues(dream, positionField)
}
