import { DreamClassAndAssociationNameTuple } from '../../types/recursiveSerialization.js'

export interface AssociationPathEdge<NodeType> {
  nextNode: NodeType | null
  tuple: DreamClassAndAssociationNameTuple
}

export default function buildAssociationPaths<NodeType>(
  rootNode: NodeType,
  opts: BuildAssociationPathsOptions<NodeType>
): DreamClassAndAssociationNameTuple[][] {
  const paths: DreamClassAndAssociationNameTuple[][] = []
  traverseAssociationPaths(rootNode, [], {}, paths, opts)
  return paths
}

function traverseAssociationPaths<NodeType>(
  node: NodeType,
  currentPath: DreamClassAndAssociationNameTuple[],
  depthTracker: Record<string, number>,
  paths: DreamClassAndAssociationNameTuple[][],
  opts: BuildAssociationPathsOptions<NodeType>
) {
  const trackerId = opts.getKey(node)
  depthTracker[trackerId] ??= 0
  if (depthTracker[trackerId] + 1 > opts.maxRepeats) {
    if (currentPath.length > 0) {
      paths.push([...currentPath])
    }
    return
  }
  depthTracker[trackerId]++

  const edges = opts.getEdges(node)

  if (edges.length === 0) {
    if (currentPath.length > 0) {
      paths.push([...currentPath])
    }
    depthTracker[trackerId]--
    return
  }

  for (const edge of edges) {
    const newPath = [...currentPath, edge.tuple]

    if (!edge.nextNode) {
      paths.push(newPath)
      continue
    }

    traverseAssociationPaths(edge.nextNode, newPath, depthTracker, paths, opts)
  }

  depthTracker[trackerId]--
}

type BuildAssociationPathsOptions<NodeType> = {
  getKey: (node: NodeType) => string
  getEdges: (node: NodeType) => AssociationPathEdge<NodeType>[]
  maxRepeats: number
}
