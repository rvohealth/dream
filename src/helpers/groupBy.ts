/**
 * Groups elements of an array into an object, using a key-generating function.
 *
 * Examples:
 *   groupBy(['Hello', 'World', 'Hello'], a => a) // { Hello: ['Hello', 'Hello'], World: ['World'] }
 *
 * @param arr - The array to group
 * @param toKey - Function to generate a key for each element
 * @returns An object mapping keys to arrays of grouped elements
 */
export default function groupBy<
  ArrayType extends any[],
  ElementType extends ArrayType extends (infer U)[] ? U : never,
>(arr: ArrayType, toKey: (a: ElementType) => string): Record<string, ArrayType> {
  return arr.reduce(
    (acc, val) => {
      const key = toKey(val)
      acc[key] ||= []
      acc[key].push(val)
      return acc
    },
    {} as Record<string, ElementType>
  )
}
