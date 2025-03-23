import sortBy from './sortBy.js'

/**
 * Returns a copy of array containing strings, numbers, bigints, and/or IdTypes, sorted in ascending order.
 * To sort other types use {@link sortBy}.
 *
 *  ```ts
 * import { sort } from '@rvoh/dream'
 *
 * sort([2, 1, 3])
 * // [1, 2, 3]
 *
 * sort(['world', 'Hello', 'hello', 'World'])
 * // ['hello', 'Hello', 'world', 'World']
 * ```
 */
export default function sort<
  ArrayType extends string[] | number[] | bigint[],
  ElementType extends ArrayType extends (infer U)[] ? U : never,
>(array: ArrayType): ArrayType {
  // Asserting types because, even though ElementType is inferred from ArrayType,
  // Typescript doesn't understand that ElementType[] is equivalent to ArrayType.
  // Changing the type signature of `sort` to `(string | number | bigint)[]` would
  // allow mixing of types within the array, which this implementation does not support
  return sortBy(array as ElementType[], (a: ElementType) => a) as unknown as ArrayType
}
