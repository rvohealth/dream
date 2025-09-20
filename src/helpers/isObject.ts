/**
 * Checks if a value is a plain object (not an array, string, null, or undefined).
 *
 * Examples:
 *   isObject({}) // true
 *   isObject([]) // false
 *   isObject('hello') // false
 *   isObject(null) // false
 *   isObject(undefined) // false
 *
 * @param x - The value to check
 * @returns True if the value is a plain object, false otherwise
 */
export default function isObject(x: any): boolean {
  if (x === null) return false
  if (Array.isArray(x)) return false
  return typeof x === 'object'
}
