import isObject from './isObject.js'

/**
 * Recursively collects all keys from a nested object into a flat array of strings.
 *
 * Examples:
 *   allNestedObjectKeys({ hello: 'world' }) // ['hello']
 *   allNestedObjectKeys({ hello: { world: 'goodbye' } }) // ['hello', 'world']
 *   allNestedObjectKeys({ hello: { world: 'goodbye', hello2: { world2: 'goodbye' } } }) // ['hello', 'world', 'hello2', 'world2']
 *
 * @param obj - The object to collect keys from
 * @returns A flat array of all nested keys
 */
export default function allNestedObjectKeys(obj: any): string[] {
  return Object.keys(obj).flatMap(key => {
    const next = obj[key]
    if (isObject(next)) return [key, allNestedObjectKeys(next)].flat()
    return [key]
  })
}
