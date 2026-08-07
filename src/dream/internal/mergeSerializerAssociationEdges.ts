import Dream from '../../Dream.js'
import { SerializerType } from '../../types/serializer.js'
import resolveSerializerAssociationEdges, {
  ResolvedSerializerAssociationEdge,
} from './resolveSerializerAssociationEdges.js'

/**
 * One contributing serializer's view of a merged target: the serializer that renders the target
 * through this association, together with how it renders it. The edge type and the serializer-side
 * association name belong here rather than on the target because they vary per contributing
 * serializer — two children of an STI base can reach the same target class through the same
 * association under different names or different edge types.
 */
export interface MergedSerializerAssociationTargetSerializer {
  serializer: SerializerType
  type: ResolvedSerializerAssociationEdge['type']
  serializerAssociationName: string
}

export interface MergedSerializerAssociationTarget {
  dreamClass: typeof Dream
  /**
   * Every serializer that renders this target through this association, deduped by serializer
   * identity. More than one when the target is itself an STI base (one serializer per child).
   */
  serializers: MergedSerializerAssociationTargetSerializer[]
}

export interface MergedSerializerAssociationEdge {
  associationAs: string
  /**
   * true when at least one contributing serializer terminates this association — a
   * delegatedAttribute (which always carries `targets: []`), or a rendersOne/rendersMany resolving
   * to no serializer.
   *
   * Independent of `targets`: an association one child terminates and another descends into (as
   * Balloon's `stiUnion` key does with `balloonLine`) is both terminating and targeted. The preload
   * walk emits a leaf path for the terminating side; the display walk ignores it, since a
   * terminated association prints nothing of its own.
   */
  terminates: boolean
  targets: MergedSerializerAssociationTarget[]
}

/**
 * @internal
 *
 * Resolves the association edges of *every* serializer that can render `dreamClass` at this point
 * in a serialization walk and merges them into one set, so that a walk rooted at an STI base sees
 * the union across its children's serializers rather than one child's view of the class.
 *
 * The merge is keyed on (association, target class), so:
 *
 * - an association several children render identically (all three `stiUnion` serializers render
 *   `sandbags`) collapses to a single edge with a single target, rather than repeating per child;
 * - a polymorphic association keeps one target per target class
 *   (`Polymorphic/Task#taskable` → `Chore` and `Workout`), which is a real distinction, not a
 *   duplicate;
 * - an association only some children render (`heartRatings`, rendered only by Latex's `stiUnion`
 *   serializer) is present exactly once.
 *
 * Grouping the serializers *under* the target rather than emitting one target per serializer is
 * what lets a caller recurse once per target class with the full set, so nested trees from
 * different children of the same target merge instead of clobbering one another.
 *
 * Insertion-ordered throughout, so edges come back in the order the serializers declare them.
 *
 * This is the single union both serializer walks run on: `buildSerializerPreloadPaths` turns these
 * edges into preload paths (taking `terminates` and the target classes, ignoring the per-serializer
 * edge type and serializer-side name), and `Dream.recursiveSerializationMap` prints them (taking the
 * per-serializer edge type and name, ignoring `terminates`). Keeping the two walks on one merge is the point: the bug
 * this exists to prevent is `psy i:serialization` and `preloadFor` disagreeing about which
 * associations a serializer key reaches, which a second hand-maintained merge invites back.
 */
export default function mergeSerializerAssociationEdges(
  dreamClass: typeof Dream,
  serializers: SerializerType[]
): MergedSerializerAssociationEdge[] {
  /**
   * Each target carries a Set mirroring its `serializers`, so the identity dedupe below is a lookup
   * rather than a scan of the array. Dropped when the merged edges are built at the end.
   */
  const mergedEdges = new Map<
    string,
    {
      terminates: boolean
      targets: Map<string, { target: MergedSerializerAssociationTarget; serializerSet: Set<SerializerType> }>
    }
  >()

  for (const serializer of serializers) {
    for (const edge of resolveSerializerAssociationEdges(dreamClass, serializer)) {
      let mergedEdge = mergedEdges.get(edge.associationAs)

      if (mergedEdge === undefined) {
        mergedEdge = { terminates: false, targets: new Map() }
        mergedEdges.set(edge.associationAs, mergedEdge)
      }

      if (edge.targets.length === 0) {
        mergedEdge.terminates = true
        continue
      }

      for (const target of edge.targets) {
        const targetKey = target.dreamClass.globalName
        const mergedTarget = mergedEdge.targets.get(targetKey)

        const targetSerializer = {
          serializer: target.serializer,
          type: edge.type,
          serializerAssociationName: edge.serializerAssociationName,
        }

        if (mergedTarget === undefined) {
          mergedEdge.targets.set(targetKey, {
            target: { dreamClass: target.dreamClass, serializers: [targetSerializer] },
            serializerSet: new Set([target.serializer]),
          })
        } else if (!mergedTarget.serializerSet.has(target.serializer)) {
          mergedTarget.serializerSet.add(target.serializer)
          mergedTarget.target.serializers.push(targetSerializer)
        }
      }
    }
  }

  return [...mergedEdges.entries()].map(([associationAs, { terminates, targets }]) => ({
    associationAs,
    terminates,
    targets: [...targets.values()].map(({ target }) => target),
  }))
}
