import sort from './sort.js'

export default function sortObjectByKey<T extends object>(obj: T): T {
  return sort(Object.keys(obj)).reduce((accumulator, key) => {
    ;(accumulator as any)[key] = (obj as any)[key]
    return accumulator
  }, {} as T)
}
