import Dream from '../../../Dream.js.js'
import sortableCacheKeyName from './sortableCacheKeyName.js.js'
import sortableCacheValuesName from './sortableCacheValuesName.js.js'

export default function clearCachedSortableValues(dream: Dream, positionField: string) {
  const cacheKey = sortableCacheKeyName(positionField)
  const cachedValuesName = sortableCacheValuesName(positionField)

  ;(dream as any)[cacheKey] = undefined
  ;(dream as any)[cachedValuesName] = undefined
}
