import Dream from '../../Dream.js'
import { HasStatement } from '../../types/associations/shared.js'
import { DreamClassAndAssociationNameTuple } from '../../types/recursiveSerialization.js'
import { RECURSIVE_DESTROY_PRELOAD_MAX_REPEATS } from '../constants.js'
import buildAssociationPaths from './buildAssociationPaths.js'

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
  const cacheKey = dreamClass.globalName
  const cached = dependentDestroyPreloadPathsCache.get(cacheKey)
  if (cached) return cached

  const paths: DreamClassAndAssociationNameTuple[][] = []
  paths.push(
    ...buildAssociationPaths(dreamClass, {
      getKey: currentDreamClass => currentDreamClass.globalName,
      getEdges: currentDreamClass => {
        const associationMap = currentDreamClass['associationMetadataMap']()
        const dependentDestroyNames = Object.keys(associationMap).filter(
          key => (associationMap[key] as HasStatement<any, any, any, any, any>).dependent === 'destroy'
        )

        return dependentDestroyNames.flatMap(associationName => {
          const association = associationMap[associationName]!
          const modelCBResult = association.modelCB()
          const targetClasses = Array.isArray(modelCBResult) ? modelCBResult : [modelCBResult]

          return targetClasses.map(targetClass => ({
            nextNode: targetClass,
            tuple: [currentDreamClass, associationName] as DreamClassAndAssociationNameTuple,
          }))
        })
      },
      maxRepeats: RECURSIVE_DESTROY_PRELOAD_MAX_REPEATS,
    })
  )
  dependentDestroyPreloadPathsCache.set(cacheKey, paths)
  return paths
}
