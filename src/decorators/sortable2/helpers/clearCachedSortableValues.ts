import Dream from '../../../Dream'
import sortableCacheKeyName from './sortableCacheKeyName'
import sortableCacheValuesName from './sortableCacheValuesName'

export default function clearCachedSortableValues(dream: Dream, positionField: string) {
  const cacheKey = sortableCacheKeyName(positionField)
  const cachedValuesName = sortableCacheValuesName(positionField)

  ;(dream as any)[cacheKey] = undefined
  ;(dream as any)[cachedValuesName] = undefined
}
