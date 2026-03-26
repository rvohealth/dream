import Dream from '../../Dream.js'
import { inferSerializersFromDreamClassOrViewModelClass } from '../../serializer/helpers/inferSerializerFromDreamOrViewModel.js'
import { DreamClassAndAssociationNameTuple } from '../../types/recursiveSerialization.js'
import { DreamModelSerializerType, SimpleObjectSerializerType } from '../../types/serializer.js'
import { RECURSIVE_SERIALIZATION_MAX_REPEATS } from '../constants.js'
import buildAssociationPaths, { AssociationPathEdge } from './buildAssociationPaths.js'
import resolveSerializerAssociationEdges from './resolveSerializerAssociationEdges.js'

type SerializerTraversalNode = {
  dreamClass: typeof Dream
  serializer: DreamModelSerializerType | SimpleObjectSerializerType
}

export default function buildSerializerPreloadPaths(
  dreamClass: typeof Dream,
  serializerKey?: string
): DreamClassAndAssociationNameTuple[][] {
  const key = serializerKey || 'default'
  const serializer = inferSerializersFromDreamClassOrViewModelClass(dreamClass, key)[0] ?? null
  if (!serializer) throw new Error(`unable to find serializer with key: ${key}`)

  const paths = buildAssociationPaths<SerializerTraversalNode>(
    {
      dreamClass,
      serializer,
    },
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

function serializerNodeToEdges({
  dreamClass,
  serializer,
}: SerializerTraversalNode): AssociationPathEdge<SerializerTraversalNode>[] {
  const edges = resolveSerializerAssociationEdges(dreamClass, serializer)

  return edges.flatMap<AssociationPathEdge<SerializerTraversalNode>>(edge => {
    const tuple: DreamClassAndAssociationNameTuple = [dreamClass, edge.associationAs]

    if (edge.type === 'delegatedAttribute' || edge.targets.length === 0) {
      return [{ nextNode: null, tuple }]
    }

    return edge.targets.map(target => ({
      nextNode: target,
      tuple,
    }))
  })
}
