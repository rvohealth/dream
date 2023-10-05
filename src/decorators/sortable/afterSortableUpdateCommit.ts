import Dream from '../../dream'
import Query from '../../dream/query'
import clearCachedSortableValues from './clearCachedSortableValues'
import positionIsInvalid from './positionIsInvalid'
import setPosition from './setPosition'

export default async function afterUpdateSortableCommit({
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

  clearCachedSortableValues(dream, cacheKey, cachedValuesName)
}
