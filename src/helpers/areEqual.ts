import Dream from '../Dream.js'
import CalendarDate from '../utils/datetime/CalendarDate.js'
import { DateTime } from '../utils/datetime/DateTime.js'

/**
 * Performs a deep equality check between two values, supporting primitives, arrays,
 * Dream instances, CalendarDate, DateTime, and objects.
 *
 * Examples:
 *   areEqual(undefined, undefined) // true
 *   areEqual(null, null) // true
 *   areEqual([1, 2], [1, 2]) // true
 *   areEqual({ a: 1 }, { a: 1 }) // true
 *   areEqual(new DateTime(), new DateTime()) // true if equal
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns True if the values are deeply equal, false otherwise
 */
export default function areEqual(a: any, b: any): boolean {
  return areEqualOrUndefined(a, b) ?? areEqualOrUndefined(b, a) ?? JSON.stringify(a) === JSON.stringify(b)
}

function areEqualOrUndefined(a: any, b: any): boolean | undefined {
  if (a === null) return b === null
  if (a === undefined) return b === undefined
  if (typeof a === 'boolean') return a === b
  if (typeof a === 'number') return a === b
  if (typeof a === 'string') return a === b
  if (a instanceof DateTime) return b instanceof DateTime && a.equals(b)
  if (a instanceof CalendarDate) return b instanceof CalendarDate && a.equals(b)

  if (Array.isArray(a))
    return Array.isArray(b) && a.length === b.length && !a.find((value, index) => !areEqual(value, b[index]))

  if (a instanceof Dream) return a.equals(b)

  return undefined
}
