import CalendarDate from '../utils/datetime/CalendarDate.js'
import { DateTime } from '../utils/datetime/DateTime.js'
import sortBy from './sortBy.js'

/**
 * Returns a copy of array containing strings, numbers, bigints, sorted in ascending order.
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
export default function sort<ArrayType extends string[] | number[] | bigint[] | (DateTime | CalendarDate)[]>(
  array: ArrayType
): ArrayType {
  return sortBy(array as number[], a => a) as ArrayType
}
