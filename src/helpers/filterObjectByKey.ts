import protectAgainstPollutingAssignment from './protectAgainstPollutingAssignment.js'

/**
 * Returns a new object containing only the specified keys from the input object, in the order provided.
 *
 * Examples:
 *   filterObjectByKey({ a: 'hello', b: 'world', c: 'goodbye' }, ['b']) // { b: 'world' }
 *   filterObjectByKey({ a: 'hello', b: 'world', c: 'goodbye' }, ['c', 'b', 'a']) // { c: 'goodbye', b: 'world', a: 'hello' }
 *
 * @param obj - The object to filter
 * @param arr - Array of keys to include in the result
 * @returns A new object containing only the specified keys, in the order provided
 */
export default function filterObjectByKey<
  T extends object,
  U extends string[],
  R extends Pick<T, U[number] & keyof T>,
>(obj: T, arr: U): R {
  const workingObj: R = {} as R
  const booleanObj: Record<string, boolean> = {}

  arr.forEach(key => (booleanObj[key] = true))

  arr.forEach(key => {
    if (booleanObj[key]) (workingObj as any)[protectAgainstPollutingAssignment(key)] = (obj as any)[key]
  })

  return workingObj
}
