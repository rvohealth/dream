import Dream from '../Dream.js'

export default function comparisonKey<ElementType>(
  val: ElementType,
  toKey: ((a: ElementType) => string | number | bigint) | undefined = undefined
): number | string | bigint | null | undefined | ((...args: any[]) => any) {
  if (val instanceof Dream) return val.comparisonKey
  if (toKey) return toKey(val)

  if (val === null) return null
  if (val === undefined) return undefined

  switch (typeof val) {
    case 'number':
    case 'string':
    case 'bigint':
      return val
    case 'function':
      return val as (...args: any[]) => any
    default:
      return val.toString()
  }
}
