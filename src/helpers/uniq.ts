import comparisonKey from './comparisonKey.js'

/**
 * Returns a new array with only unique elements, using a comparator function or default comparison logic.
 *
 * Examples:
 *   uniq([1, 2, 2, 3]) // [1, 2, 3]
 *   uniq([{ id: 1 }, { id: 1 }, { id: 2 }], x => x.id) // [{ id: 1 }, { id: 2 }]
 *   uniq([dream1, dream2, dream3]) // [dream1, dream2] (uses Dream comparator)
 *
 * @param arr - The array to deduplicate
 * @param toKey - Optional function to generate a comparison key for each element
 * @returns A new array containing only unique elements
 */
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
