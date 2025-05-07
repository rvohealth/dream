import Dream from '../Dream.js'

export default function comparisonKey<ElementType>(
  val: ElementType,
  toKey: ((a: ElementType) => string | number | bigint) | undefined = undefined
) {
  return (val as unknown as Dream)?.isDreamInstance
    ? (val as unknown as Dream).comparisonKey
    : toKey
      ? toKey(val)
      : val
}
