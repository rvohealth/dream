import { ClockTime, ClockTimeTz } from '../package-exports/index.js'
import CalendarDate from '../utils/datetime/CalendarDate.js'
import { DateTime } from '../utils/datetime/DateTime.js'

export default function sortBy<T>(array: T[], valueToCompare: (value: T) => number): T[]
export default function sortBy<T>(array: T[], valueToCompare: (value: T) => bigint): T[]
export default function sortBy<T>(array: T[], valueToCompare: (value: T) => string): T[]
export default function sortBy<T>(array: T[], valueToCompare: (value: T) => DateTime | CalendarDate): T[]
export default function sortBy<T>(array: T[], valueToCompare: (value: T) => ClockTime): T[]
export default function sortBy<T>(array: T[], valueToCompare: (value: T) => ClockTimeTz): T[]
/**
 * Returns a copy of the array, sorted by the value returned by calling the function in the second argument on each element in the array.
 *
 * Examples:
 *   sortBy(['aaa', 'a', 'aa'], str => str.length) // ['a', 'aa', 'aaa']
 *   sortBy(['aaa', 'a', 'aa'], str => -str.length) // ['aaa', 'aa', 'a']
 *   sortBy([5, 3, 7], num => num) // [3, 5, 7]
 *   sortBy([5, 3, 7], num => -num) // [7, 5, 3]
 *   sortBy([bigint1, bigint2], x => x) // sorted bigints
 *   sortBy([obj1, obj2], obj => obj.prop) // sorted by property
 *
 * @param array - The array to sort
 * @param valueToCompare - Function returning the value to sort by
 * @returns A new sorted array
 */
export default function sortBy<T>(array: T[], valueToCompare: (value: T) => unknown) {
  const arrayClone = [...array]
  return arrayClone.sort((a: T, b: T) => {
    const aPrime = valueToCompare(a)
    const bPrime = valueToCompare(b)

    if (typeof aPrime === 'number' && typeof bPrime === 'number') return aPrime - bPrime
    if (typeof aPrime === 'bigint' && typeof bPrime === 'bigint')
      return aPrime > bPrime ? 1 : aPrime < bPrime ? -1 : 0
    if (typeof aPrime === 'string' && typeof bPrime === 'string') return aPrime.localeCompare(bPrime)

    if (
      ((aPrime instanceof DateTime || aPrime instanceof CalendarDate) &&
        (bPrime instanceof DateTime || bPrime instanceof CalendarDate)) ||
      (aPrime instanceof ClockTime && bPrime instanceof ClockTime) ||
      (aPrime instanceof ClockTimeTz && bPrime instanceof ClockTimeTz)
    ) {
      return aPrime.valueOf().localeCompare(bPrime.valueOf())
    }

    throw new UnsupportedValueFromComparisonFunction(aPrime, bPrime)
  })
}

export class UnsupportedValueFromComparisonFunction extends Error {
  constructor(
    private aPrime: any,
    private bPrime: any
  ) {
    super()
  }

  public override get message() {
    return `Value incompatible with compare: ${this.aPrime}, ${this.bPrime}`
  }
}
