import Dream from '../../Dream.js'
import { inferSerializersFromDreamClassOrViewModelClassOrFail } from '../../serializer/helpers/inferSerializerFromDreamOrViewModel.js'
import { DreamClassAndAssociationNameTuple } from '../../types/recursiveSerialization.js'
import { SerializerType } from '../../types/serializer.js'
import { RECURSIVE_SERIALIZATION_MAX_REPEATS } from '../constants.js'
import buildAssociationPaths, { AssociationPathEdge } from './buildAssociationPaths.js'
import mergeSerializerAssociationEdges from './mergeSerializerAssociationEdges.js'

/**
 * A single traversal node covers a Dream class together with *every* serializer that can render it
 * at this point in the walk, rather than one serializer at a time. See buildSerializerPreloadPaths.
 */
type SerializerTraversalNode = {
  dreamClass: typeof Dream
  serializers: SerializerType[]
}

export default function buildSerializerPreloadPaths(
  dreamClass: typeof Dream,
  serializerKey?: string
): DreamClassAndAssociationNameTuple[][] {
  const key = serializerKey || 'default'

  /**
   * When `dreamClass` is an STI base, this returns one serializer per STI child (deduped), since
   * each child may register a different serializer under `key`. Every child's serializer has to be
   * walked: an association rendered only by, say, the alphabetically-last child would otherwise be
   * missing from the preload set and throw NonLoadedAssociation at render time.
   */
  const serializers = inferSerializersFromDreamClassOrViewModelClassOrFail(dreamClass, key)

  /**
   * All of the serializers are walked in a *single* traversal, as one node per Dream class carrying
   * the set of serializers that reach it, rather than one traversal per serializer. A path is a
   * sequence of [DreamClass, associationName] tuples — it records no serializer — so walking each
   * serializer separately recomputes the same paths once per route through the graph, which is
   * exponential in the number of sibling serializers when a serializer cycles back to the STI base.
   * Merging is exactly equivalent: an edge is emitted from the merged node when *some* serializer in
   * the set declares it, and every serializer in the set is reachable by a real route with this
   * path's prefix, so the merged walk emits precisely the paths the per-serializer walks emit after
   * deduping — with one exception: where one serializer of a class renders no associations and
   * another renders some, the per-serializer walk also emitted the bare prefix path reached by the
   * first, which is a strict prefix of a path the second contributes and so preloads nothing extra.
   * The recursion budget is keyed on the Dream class and counted along the current path, so it is
   * unaffected by the merge.
   *
   * Every tuple emitted at the root of the traversal carries `dreamClass` (the STI base) rather than
   * the contributing child, both so that identical paths dedupe below and so that a caller's
   * `modifierFn` keeps receiving the class it was queried on. Tuples emitted deeper in a path carry
   * the association's target class, which is what `modifierFn` receives for a nested association.
   */
  const paths = buildAssociationPaths<SerializerTraversalNode>(
    { dreamClass, serializers },
    {
      getKey: node => node.dreamClass.globalName,
      getEdges: memoizedSerializerNodeToEdges(),
      maxRepeats: RECURSIVE_SERIALIZATION_MAX_REPEATS,
    }
  )

  const dedupedPaths = new Map<string, DreamClassAndAssociationNameTuple[]>()
  for (const path of paths) {
    dedupedPaths.set(
      path
        .map(([pathDreamClass, associationName]) => `${pathDreamClass.globalName}:${associationName}`)
        .join('|'),
      path
    )
  }

  return [...dedupedPaths.values()]
}

/**
 * `serializerNodeToEdges` is a pure function of the node's (Dream class, ordered serializer set), so
 * two nodes carrying the same pair have the same edges no matter which route reached them. The
 * traversal hands `getEdges` a *fresh* node object per edge it descends — the `nextNode`s built
 * below are new objects every time — so memoizing on the object itself would never hit; the key has
 * to be the node's contents. Without this the whole merge (resolve every serializer's edges, then
 * one Map per association and one node object per target class) is rebuilt at every visit, and the
 * visit count is the number of *routes* through the serializer graph rather than the number of
 * distinct nodes in it: an STI base whose children render `n` differently-named self-referential
 * associations visits 1 + n + n² + n³ nodes to reach n⁴ paths, all of them the same one node.
 *
 * The serializer identifiers are assigned per call rather than globally so that the key stays short
 * and so that nothing here holds a serializer alive; identity is all that matters, since the key is
 * only ever compared against others built in the same call. Order-sensitive on purpose: the merge
 * is insertion-ordered, so two nodes carrying the same serializers in a different order do not have
 * the same edges.
 *
 * Scoped to a single `buildSerializerPreloadPaths` call for the same reason: it cannot then serve
 * edges resolved against a stale serializer registry or a not-yet-complete set of STI children.
 */
function memoizedSerializerNodeToEdges(): (
  node: SerializerTraversalNode
) => AssociationPathEdge<SerializerTraversalNode>[] {
  const cache = new Map<string, AssociationPathEdge<SerializerTraversalNode>[]>()
  const serializerIds = new Map<SerializerType, number>()

  const serializerId = (serializer: SerializerType): number => {
    let id = serializerIds.get(serializer)

    if (id === undefined) {
      id = serializerIds.size
      serializerIds.set(serializer, id)
    }

    return id
  }

  return node => {
    const cacheKey = `${node.dreamClass.globalName}|${node.serializers.map(serializerId).join(',')}`
    const cached = cache.get(cacheKey)
    if (cached !== undefined) return cached

    const edges = serializerNodeToEdges(node)
    cache.set(cacheKey, edges)
    return edges
  }
}

/**
 * `mergeSerializerAssociationEdges` — the single union both serializer walks run on, the other being
 * `Dream.recursiveSerializationMap`'s display walk — has already resolved every serializer in the
 * node's set and merged them into one insertion-ordered edge set keyed on (association, target
 * class). All that is left here is to shed what only the display walk needs (the per-serializer edge
 * type and serializer-side association name) and turn each merged edge into path edges: a leaf where
 * some serializer terminates the association, plus one traversal node per target class carrying that
 * class's serializers.
 */
function serializerNodeToEdges({
  dreamClass,
  serializers,
}: SerializerTraversalNode): AssociationPathEdge<SerializerTraversalNode>[] {
  return mergeSerializerAssociationEdges(dreamClass, serializers).flatMap<
    AssociationPathEdge<SerializerTraversalNode>
  >(edge => {
    const tuple: DreamClassAndAssociationNameTuple = [dreamClass, edge.associationAs]

    return [
      ...(edge.terminates ? [{ nextNode: null, tuple }] : []),
      ...edge.targets.map(target => ({
        nextNode: {
          dreamClass: target.dreamClass,
          serializers: target.serializers.map(({ serializer }) => serializer),
        },
        tuple,
      })),
    ]
  })
}
