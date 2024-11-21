import Dream from '../../../Dream2'
import sortableCacheKeyName from './sortableCacheKeyName'
import sortableCacheValuesName from './sortableCacheValuesName'

export default function clearCachedSortableValues(dream: Dream, positionField: string) {
  const cacheKey = sortableCacheKeyName(positionField)
  const cachedValuesName = sortableCacheValuesName(positionField)

  ;(dream as any)[cacheKey] = undefined
  ;(dream as any)[cachedValuesName] = undefined
}
