import Dream from '../../../../Dream.js'
import sortableCacheValuesName from './sortableCacheValuesName.js'

export default function clearCachedSortableValues(dream: Dream, positionField: string) {
  const cachedValuesName = sortableCacheValuesName(positionField)

  ;(dream as any)[cachedValuesName] = undefined
}
