import Dream from '../Dream.js'

export default function comparisonKey<ElementType>(
  val: ElementType,
  toKey: ((a: ElementType) => string | number | bigint) | undefined = undefined
) {
  return val instanceof Dream ? val.comparisonKey : toKey ? toKey(val) : val
}
