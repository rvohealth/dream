import Dream from '../../Dream.js'

/**
 * Turns RecursiveSerializerInfo into an array of arrays of tuples,
 * each tuple including a Dream class and an association name
 *
 * E.g., returns the following:
 * ```ts
 * [
 *   [[Post, 'a'], [Pet, 'b']],
 *   [[Post, 'a'], [Balloon, 'd'], [BalloonLine, 'e']]
 * ]
 * ```
 */
export default function extractNestedPaths<T extends RecursiveSerializerInfo>(
  obj: T
): DreamClassAndAssociationNameTuple[][] {
  const paths: DreamClassAndAssociationNameTuple[][] = []

  function traverse(current: RecursiveSerializerInfo, currentPath: DreamClassAndAssociationNameTuple[]) {
    const associationNames = Object.keys(current)

    if (associationNames.length === 0) {
      paths.push([...currentPath])
      return
    }

    for (const associationName of associationNames) {
      const serializerInfo = current[associationName]
      if (serializerInfo === undefined) throw new Error('shouldn’t be undefined')
      const dreamClass = serializerInfo.parentDreamClass
      const nestedSerializerInfo = serializerInfo.nestedSerializerInfo
      const tuple: DreamClassAndAssociationNameTuple = [dreamClass, associationName]
      const newPath = [...currentPath, tuple]
      traverse(nestedSerializerInfo, newPath)
    }
  }

  traverse(obj, [])
  return paths
}

export type DreamClassAndAssociationNameTuple = [typeof Dream, string]

export type RecursiveSerializerInfo = {
  [associationName: string]: {
    parentDreamClass: typeof Dream
    nestedSerializerInfo: RecursiveSerializerInfo
  }
}
