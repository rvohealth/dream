import Dream from '../../Dream.js'
import DreamTransaction from '../DreamTransaction.js'
import { ReallyDestroyOptions } from './destroyDream.js'
import loadDependentDestroyTree from './loadDependentDestroyTree.js'

/**
 * @internal
 *
 * Marks a Dream instance as one whose `dependent: 'destroy'` associations were
 * hydrated by this cascade's own call to `loadDependentDestroyTree`, using the
 * same destroy options the cascade is running under.
 *
 * Associations a caller happened to preload themselves (e.g.
 * `Post.preload('comments')`) are deliberately NOT trusted: they may have been
 * loaded under different default scopes than the destroy requires — most
 * importantly, `reallyDestroy` strips the soft-delete scope, so a
 * caller-preloaded association could be missing soft-deleted records that the
 * cascade must destroy.
 */
const CASCADE_LOADED = Symbol.for('dream:dependentDestroyTreeLoaded')

/**
 * @internal
 *
 * Destroys all HasOne/HasMany associations on this
 * dream that are marked as `dependent: 'destroy'`.
 *
 * The whole dependent-destroy tree is loaded ONCE, at the root of the destroy
 * operation, by `loadDependentDestroyTree`. Descendants reached by recursing
 * through this function consume those already-hydrated associations rather
 * than re-querying their own subtrees.
 *
 * A load still happens here when an association is not hydrated. That covers
 * two cases:
 *
 * 1. the root of the operation, whose associations have not been loaded yet
 * 2. a node past `RECURSIVE_DESTROY_PRELOAD_MAX_REPEATS` levels of
 *    self-reference, which the root's preload could not reach
 *
 * The second case is why the check is per-association-hydration rather than a
 * "descendants are already loaded" flag: such a flag would truncate cascades
 * deeper than the preload horizon.
 *
 * NOTE: reusing a hydrated subtree is only sound because the same `options`
 * are forwarded unchanged all the way down the cascade (see the recursive
 * `destroy`/`reallyDestroy` calls below), so every node's associations were
 * loaded under the scopes this node would have used. Nothing in the types
 * enforces that; if `options` ever start varying by depth, this reuse has to
 * be revisited.
 */
export default async function destroyAssociatedRecords<I extends Dream>(
  dream: I,
  txn: DreamTransaction<I>,
  options: ReallyDestroyOptions<I>
) {
  const dreamClass = dream.constructor as typeof Dream
  const { reallyDestroy } = options

  // `loadDependentDestroyTree` hydrates and returns a CLONE rather than
  // mutating the receiver, so the result must be assigned back — otherwise
  // each association in the loop below would trigger its own reload.
  let dreamWithAssociations: I = dream
  let alreadyLoadedTree = false

  for (const associationName of dreamClass['dependentDestroyAssociationNames']()) {
    if (!alreadyLoadedTree && !cascadeLoaded(dreamWithAssociations, associationName)) {
      dreamWithAssociations = await loadDependentDestroyTree(dreamWithAssociations, txn, {
        reallyDestroy,
        bypassAllDefaultScopes: options.bypassAllDefaultScopes ?? false,
        defaultScopesToBypass: options.defaultScopesToBypass ?? [],
      })
      alreadyLoadedTree = true
    }

    const loaded = (dreamWithAssociations as any)[associationName]
    const records: Dream[] = Array.isArray(loaded) ? loaded : loaded ? [loaded] : []

    for (const record of records) {
      markCascadeLoaded(record)

      if (reallyDestroy) {
        await (record as any).txn(txn).reallyDestroy(options)
      } else {
        await (record as any).txn(txn).destroy(options)
      }
    }
  }
}

/**
 * @internal
 *
 * True when this dream was hydrated by this cascade's own preload AND the
 * given association is hydrated on it.
 */
function cascadeLoaded(dream: Dream, associationName: string): boolean {
  if (!(dream as any)[CASCADE_LOADED]) return false
  return (dream as any).loaded(associationName)
}

/**
 * @internal
 *
 * A plain assignment rather than `Object.defineProperty`: the key is a symbol,
 * so it is already excluded from `Object.keys`, `for...in` and
 * `JSON.stringify` without an explicit descriptor, and this runs once per node
 * of a potentially wide cascade tree.
 */
function markCascadeLoaded(dream: Dream): void {
  ;(dream as any)[CASCADE_LOADED] = true
}
