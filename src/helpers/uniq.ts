import Dream from '../Dream.js.js'

export default function uniq<T>(arr: T[], toKey: ((a: T) => string) | undefined = undefined): T[] {
  if (toKey) return uniqWith(arr, toKey)
  else if ((arr[0] as Dream)?.isDreamInstance) return uniqWith(arr as Dream[], dreamKey) as T[]
  else return Array.from(new Set(arr))
}

function dreamKey(dream: Dream): string {
  return `${(dream.constructor as typeof Dream).globalName}:${dream.primaryKeyValue}`
}

function uniqWith<T>(arr: T[], toKey: (a: T) => string): T[] {
  const map: Record<string, T> = arr.reduce(
    (acc, val) => {
      acc[toKey(val)] ||= val
      return acc
    },
    {} as Record<string, T>
  )

  return Object.values(map)
}
