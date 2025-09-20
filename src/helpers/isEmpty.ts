/**
 * Checks if an array, object, Set, or Map is empty.
 *
 * Examples:
 *   isEmpty([]) // true
 *   isEmpty({}) // true
 *   isEmpty(new Map()) // true
 *   isEmpty(new Set()) // true
 *   isEmpty(['hello']) // false
 *   isEmpty({ hello: 'world' }) // false
 *
 * @param value - The value to check for emptiness
 * @returns True if the value is empty, false otherwise
 */
export default function isEmpty(
  value: unknown[] | Record<string, unknown> | Set<unknown> | Map<unknown, unknown>
): boolean {
  if (Array.isArray(value)) return value.length === 0
  if (value instanceof Map || value instanceof Set) return value.size === 0
  return Object.keys(value).length === 0
}
