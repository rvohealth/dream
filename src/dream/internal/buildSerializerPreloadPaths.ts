import Dream from '../../Dream.js'
import { inferSerializersFromDreamClassOrViewModelClass } from '../../serializer/helpers/inferSerializerFromDreamOrViewModel.js'
import { DreamClassAndAssociationNameTuple } from '../../types/recursiveSerialization.js'
import { DreamModelSerializerType, SimpleObjectSerializerType } from '../../types/serializer.js'
import { RECURSIVE_SERIALIZATION_MAX_REPEATS } from '../constants.js'
import buildAssociationPaths, { AssociationPathEdge } from './buildAssociationPaths.js'
import resolveSerializerAssociationEdges from './resolveSerializerAssociationEdges.js'

type SerializerType = DreamModelSerializerType | SimpleObjectSerializerType

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
  const serializers = inferSerializersFromDreamClassOrViewModelClass(dreamClass, key)
  // Unreachable today, and deliberately not phrased as "no serializer found for key": a serializer
  // key that a class does not register throws MissingSerializersDefinitionForKey (and a class with
  // no `serializers` getter at all throws MissingSerializersDefinition) from inside the call above,
  // and expandStiClasses always yields at least one class. The guard exists only so that a future
  // change to any of those cannot turn an unresolvable serializer into a silently empty preload set.
  if (serializers.length === 0)
    throw new Error(
      `buildSerializerPreloadPaths: no serializers resolved for ${dreamClass.globalName} under serializer key "${key}". This should be impossible — an unresolvable serializer key throws before reaching here — and indicates a bug in Dream.`
    )

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
      getEdges: serializerNodeToEdges,
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

type MergedEdge = {
  /**
   * true when some serializer in the node's set terminates this association (a delegatedAttribute,
   * or a rendersOne/rendersMany whose target resolves to no serializer)
   */
  terminates: boolean
  targets: Map<string, SerializerTraversalNode>
}

function serializerNodeToEdges({
  dreamClass,
  serializers,
}: SerializerTraversalNode): AssociationPathEdge<SerializerTraversalNode>[] {
  // insertion-ordered, so edges are emitted in the order the serializers declare them
  const mergedEdges = new Map<string, MergedEdge>()

  for (const serializer of serializers) {
    for (const edge of resolveSerializerAssociationEdges(dreamClass, serializer)) {
      let mergedEdge = mergedEdges.get(edge.associationAs)

      if (mergedEdge === undefined) {
        mergedEdge = { terminates: false, targets: new Map() }
        mergedEdges.set(edge.associationAs, mergedEdge)
      }

      if (edge.type === 'delegatedAttribute' || edge.targets.length === 0) {
        mergedEdge.terminates = true
        continue
      }

      for (const target of edge.targets) {
        const targetKey = target.dreamClass.globalName
        const targetNode = mergedEdge.targets.get(targetKey)

        if (targetNode === undefined) {
          mergedEdge.targets.set(targetKey, {
            dreamClass: target.dreamClass,
            serializers: [target.serializer],
          })
        } else if (!targetNode.serializers.includes(target.serializer)) {
          targetNode.serializers.push(target.serializer)
        }
      }
    }
  }

  return [...mergedEdges.entries()].flatMap<AssociationPathEdge<SerializerTraversalNode>>(
    ([associationAs, mergedEdge]) => {
      const tuple: DreamClassAndAssociationNameTuple = [dreamClass, associationAs]

      return [
        ...(mergedEdge.terminates ? [{ nextNode: null, tuple }] : []),
        ...[...mergedEdge.targets.values()].map(nextNode => ({ nextNode, tuple })),
      ]
    }
  )
}
