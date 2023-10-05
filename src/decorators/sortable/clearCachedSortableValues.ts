import Dream from '../../dream'

export default function clearCachedSortableValues(dream: Dream, cacheKey: string, cachedValuesName: string) {
  ;(dream as any)[cacheKey] = undefined
  ;(dream as any)[cachedValuesName] = undefined
}
