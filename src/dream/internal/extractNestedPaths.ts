/**
 * this function will extract nested paths from an object, and place them
 * into a multi-dimensional tuple, like so:
 *
 * ```ts
 * extractNestedPaths({ a: { b: { c: {} }, d: { e: {} }}})
 * ```
 *
 * into this:
 *
 * ```ts
 * [
 *   ['a', 'b', 'c'],
 *   ['a', 'd', 'e']
 * ]
 * ```
 */
export default function extractNestedPaths<T extends NestedObject>(obj: T): string[][] {
  const paths: string[][] = []

  function traverse(current: NestedObject, currentPath: string[]) {
    const keys = Object.keys(current)

    if (keys.length === 0) {
      paths.push([...currentPath])
      return
    }

    for (const key of keys) {
      const value = current[key]
      const newPath = [...currentPath, key]

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        traverse(value, newPath)
      } else {
        paths.push(newPath)
      }
    }
  }

  traverse(obj, [])
  return paths
}

type NestedObject = {
  [key: string]: any
}
