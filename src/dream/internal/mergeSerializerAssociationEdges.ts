import Dream from '../../Dream.js'
import { DreamModelSerializerType, SimpleObjectSerializerType } from '../../types/serializer.js'
import resolveSerializerAssociationEdges, {
  ResolvedSerializerAssociationEdge,
} from './resolveSerializerAssociationEdges.js'

type SerializerType = DreamModelSerializerType | SimpleObjectSerializerType

export interface MergedSerializerAssociationTarget {
  dreamClass: typeof Dream
  type: ResolvedSerializerAssociationEdge['type']
  serializerAssociationName: string
  /**
   * Every serializer that renders this target through this association, deduped by identity. More
   * than one when the target is itself an STI base (one serializer per child).
   */
  serializers: SerializerType[]
}

export interface MergedSerializerAssociationEdge {
  associationAs: string
  /**
   * Empty when every contributing serializer terminates this association — a delegatedAttribute
   * (which always carries `targets: []`), or a rendersOne/rendersMany resolving to no serializer.
   */
  targets: MergedSerializerAssociationTarget[]
}

/**
 * @internal
 *
 * Resolves the association edges of *every* serializer that can render `dreamClass` at this point
 * in a serialization walk and merges them into one set, so that a walk rooted at an STI base sees
 * the union across its children's serializers rather than one child's view of the class.
 *
 * The merge is keyed on (association, edge type, target class), so:
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
 * This is the same union `buildSerializerPreloadPaths` builds for preload paths (its own
 * `serializerNodeToEdges`); the two are kept separate because that one needs only "does something
 * terminate here" while this one needs the edge type and the association's serializer-side name in
 * order to print them.
 */
export default function mergeSerializerAssociationEdges(
  dreamClass: typeof Dream,
  serializers: SerializerType[]
): MergedSerializerAssociationEdge[] {
  const mergedEdges = new Map<string, Map<string, MergedSerializerAssociationTarget>>()

  for (const serializer of serializers) {
    for (const edge of resolveSerializerAssociationEdges(dreamClass, serializer)) {
      let targets = mergedEdges.get(edge.associationAs)

      if (targets === undefined) {
        targets = new Map()
        mergedEdges.set(edge.associationAs, targets)
      }

      for (const target of edge.targets) {
        const targetKey = `${edge.type}:${target.dreamClass.globalName}`
        const mergedTarget = targets.get(targetKey)

        if (mergedTarget === undefined) {
          targets.set(targetKey, {
            dreamClass: target.dreamClass,
            type: edge.type,
            serializerAssociationName: edge.serializerAssociationName,
            serializers: [target.serializer],
          })
        } else if (!mergedTarget.serializers.includes(target.serializer)) {
          mergedTarget.serializers.push(target.serializer)
        }
      }
    }
  }

  return [...mergedEdges.entries()].map(([associationAs, targets]) => ({
    associationAs,
    targets: [...targets.values()],
  }))
}
