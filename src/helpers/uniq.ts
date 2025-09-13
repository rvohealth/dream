import comparisonKey from './comparisonKey.js'

export default function uniq<
  ArrayType extends any[],
  ElementType extends ArrayType extends (infer U)[] ? U : never,
>(arr: ArrayType, toKey: ((a: ElementType) => string | number | bigint) | undefined = undefined): ArrayType {
  const map = arr.reduce((acc: Map<any, ElementType>, val) => {
    const key = comparisonKey(val, toKey)
    if (!acc.has(key)) acc.set(key, val)
    return acc
  }, new Map())

  return [...map.values()] as ArrayType
}
