export default function freezeBaseClassArrayMap<T extends Record<string, readonly any[] | any[]>>(map: T): T {
  return Object.freeze(
    Object.keys(map).reduce((frozenMap, key) => {
      ;(frozenMap as any)[key] = Object.freeze(map[key])
      return frozenMap
    }, {} as T)
  )
}
