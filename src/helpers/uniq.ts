import comparisonKey from './comparisonKey.js'

export default function uniq<
  ArrayType extends any[],
  ElementType extends ArrayType extends (infer U)[] ? U : never,
>(arr: ArrayType, toKey: ((a: ElementType) => string | number | bigint) | undefined = undefined): ArrayType {
  const map: Record<string, ElementType> = arr.reduce(
    (acc, val) => {
      const baseKey = comparisonKey(val, toKey)
      // Prefix with underscore to ensure that the values cannot be _interpreted_ as integers.
      // If they can be interpreted as integers, then the keys are ordered not by the
      // order in which they were added, but in ascending numerical order.
      const key = typeof baseKey === 'string' ? baseKey : `_${baseKey}`
      acc[key] ||= val
      return acc
    },
    {} as Record<string, ElementType>
  )

  return Object.values(map) as ArrayType
}
