import Dream from '../Dream.js'

export default function uniq<
  ArrayType extends any[],
  ElementType extends ArrayType extends (infer U)[] ? U : never,
>(arr: ArrayType, toKey: ((a: ElementType) => string | number | bigint) | undefined = undefined): ArrayType {
  if (toKey) return uniqWith(arr, toKey)
  return uniqWith(arr, a => String(a))
}

function dreamKey(dream: Dream): string {
  return `${(dream.constructor as typeof Dream).globalName}:${dream.primaryKeyValue}`
}

function uniqWith<ArrayType extends any[], ElementType extends ArrayType extends (infer U)[] ? U : never>(
  arr: ArrayType,
  toKey: (a: ElementType) => string | number | bigint
): ArrayType {
  const map: Record<string, ElementType> = arr.reduce(
    (acc, val) => {
      // Prefix with underscore to ensure that the values cannot be interpreted as integers.
      // If they can be interpreted as integers, then the keys are ordered not by the
      // order in which they were added, but in ascending numerical order.
      const key = (val as unknown as Dream)?.isDreamInstance ? dreamKey(val) : `_${toKey(val)}`
      acc[key] ||= val
      return acc
    },
    {} as Record<string, ElementType>
  )

  return Object.values(map) as ArrayType
}
