export default function groupBy<
  ArrayType extends any[],
  ElementType extends ArrayType extends (infer U)[] ? U : never,
>(arr: ArrayType, toKey: (a: ElementType) => string): Record<string, ArrayType> {
  return arr.reduce(
    (acc, val) => {
      const key = toKey(val)
      acc[key] ||= []
      acc[key].push(val)
      return acc
    },
    {} as Record<string, ElementType>
  )
}
