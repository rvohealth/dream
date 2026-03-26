import Dream from '../../Dream.js'
import { HasStatement } from '../../types/associations/shared.js'
import { DreamClassAndAssociationNameTuple } from './extractNestedPaths.js'

const MAX_REPEATS = 4
const dependentDestroyPreloadPathsCache = new Map<string, DreamClassAndAssociationNameTuple[][]>()

/**
 * @internal
 *
 * Recursively walks `dependent: 'destroy'` associations starting from the given
 * Dream class, producing an array of preload paths. Each path is an array of
 * [DreamClass, associationName] tuples representing a chain from root to leaf.
 *
 * Allows the same Dream class to appear up to MAX_REPEATS times in a single
 * path to support tree structures (e.g. a Category with `dependent: 'destroy'`
 * on its children, which are also Categories).
 *
 * Used to build a preload tree so that all records in the cascade can be loaded
 * upfront, eliminating N+1 queries during destroy.
 */
export default function buildDependentDestroyPreloadPaths(
  dreamClass: typeof Dream
): DreamClassAndAssociationNameTuple[][] {
  const cacheKey = dreamClass.sanitizedName
  const cached = dependentDestroyPreloadPathsCache.get(cacheKey)
  if (cached) return cached

  const paths: DreamClassAndAssociationNameTuple[][] = []
  traverse(dreamClass, [], {}, paths)
  dependentDestroyPreloadPathsCache.set(cacheKey, paths)
  return paths
}

function traverse(
  dreamClass: typeof Dream,
  currentPath: DreamClassAndAssociationNameTuple[],
  depthTracker: Record<string, number>,
  paths: DreamClassAndAssociationNameTuple[][]
) {
  const trackerId = dreamClass.sanitizedName
  depthTracker[trackerId] ??= 0
  if (depthTracker[trackerId] + 1 > MAX_REPEATS) {
    if (currentPath.length > 0) {
      paths.push([...currentPath])
    }
    return
  }
  depthTracker[trackerId]++

  const associationMap = dreamClass['associationMetadataMap']()
  const dependentDestroyNames = Object.keys(associationMap).filter(
    key => (associationMap[key] as HasStatement<any, any, any, any, any>).dependent === 'destroy'
  )

  if (dependentDestroyNames.length === 0) {
    if (currentPath.length > 0) {
      paths.push([...currentPath])
    }
    depthTracker[trackerId]--
    return
  }

  for (const associationName of dependentDestroyNames) {
    const association = associationMap[associationName]!
    const modelCBResult = association.modelCB()
    const targetClasses = Array.isArray(modelCBResult) ? modelCBResult : [modelCBResult]

    for (const targetClass of targetClasses) {
      const tuple: DreamClassAndAssociationNameTuple = [dreamClass, associationName]
      const newPath = [...currentPath, tuple]

      traverse(targetClass, newPath, { ...depthTracker }, paths)
    }
  }

  depthTracker[trackerId]--
}
