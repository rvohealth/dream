import Dream from '../../Dream.js'
import DreamTransaction from '../DreamTransaction.js'
import LoadBuilder from '../LoadBuilder.js'
import buildDependentDestroyPreloadPaths from './buildDependentDestroyPreloadPaths.js'
import convertDreamClassAndAssociationNameTupleArrayToPreloadArgs from './convertDreamClassAndAssociationNameTupleArrayToPreloadArgs.js'

/**
 * @internal
 *
 * Loads all `dependent: 'destroy'` associations onto the dream instance
 * upfront, eliminating N+1 queries during cascade destruction.
 *
 * Returns a clone of the dream with all associations loaded.
 * If there are no dependent-destroy associations, returns the original dream.
 */
export default async function loadDependentDestroyTree<I extends Dream>(
  dream: I,
  txn: DreamTransaction<I>,
  {
    reallyDestroy,
    bypassAllDefaultScopes,
    defaultScopesToBypass,
  }: {
    reallyDestroy: boolean
    bypassAllDefaultScopes: boolean
    defaultScopesToBypass: string[]
  }
): Promise<I> {
  const dreamClass = dream.constructor as typeof Dream
  const paths = buildDependentDestroyPreloadPaths(dreamClass)

  if (paths.length === 0) return dream

  let loadBuilder = new LoadBuilder<I>(dream, txn)

  for (const path of paths) {
    const args = convertDreamClassAndAssociationNameTupleArrayToPreloadArgs(path)
    loadBuilder = loadBuilder.load(...(args as [any]))
  }

  if (bypassAllDefaultScopes) {
    loadBuilder = loadBuilder.removeAllDefaultScopes()
  } else {
    for (const scopeName of defaultScopesToBypass) {
      loadBuilder = loadBuilder.removeDefaultScope(scopeName as any)
    }
  }

  if (reallyDestroy) {
    loadBuilder = loadBuilder.removeDefaultScope('dream:SoftDelete' as any)
  }

  return await loadBuilder.execute()
}
