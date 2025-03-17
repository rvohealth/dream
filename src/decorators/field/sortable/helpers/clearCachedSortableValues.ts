import Dream from '../../../../Dream.js'
import sortableCacheKeyName from './sortableCacheKeyName.js'
import sortableCacheValuesName from './sortableCacheValuesName.js'

export default function clearCachedSortableValues(dream: Dream, positionField: string) {
  const cacheKey = sortableCacheKeyName(positionField)
  const cachedValuesName = sortableCacheValuesName(positionField)

  ;(dream as any)[cacheKey] = undefined
  ;(dream as any)[cachedValuesName] = undefined
}
