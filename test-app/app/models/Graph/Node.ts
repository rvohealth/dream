import { DreamColumn, DreamSerializers } from '../../../../src/dream/types'
import ApplicationModel from '../ApplicationModel'
import GraphEdge from './Edge'
import EdgeNode from './EdgeNode'

export default class Node extends ApplicationModel {
  public get table() {
    return 'graph_nodes' as const
  }

  public get serializers(): DreamSerializers<Node> {
    return { default: 'Graph/NodeSerializer' }
  }

  public id: DreamColumn<Node, 'id'>
  public name: DreamColumn<Node, 'name'>
  public omittedEdgePosition: DreamColumn<Node, 'omittedEdgePosition'>
  public createdAt: DreamColumn<Node, 'createdAt'>
  public updatedAt: DreamColumn<Node, 'updatedAt'>

  @Node.HasMany('Graph/EdgeNode', { foreignKey: 'nodeId' })
  public edgeNodes: EdgeNode[]

  @Node.HasMany('Graph/EdgeNode', { foreignKey: 'nodeId', order: 'position' })
  public orderedEdgeNodes: EdgeNode[]

  @Node.HasMany('Graph/Edge', { through: 'edgeNodes', preloadThroughColumns: ['position', 'createdAt'] })
  public edges: GraphEdge[]

  @Node.HasMany('Graph/Edge', {
    through: 'edgeNodes',
    preloadThroughColumns: { position: 'aliasedPosition', createdAt: 'aliasedCreatedAt' },
    source: 'edge',
  })
  public edgesWithAliasedPreloads: GraphEdge[]

  @Node.HasMany('Graph/Edge', { through: 'edgeNodes', order: 'name', source: 'edge' })
  public edgesOrderedByName: GraphEdge[]

  @Node.HasMany('Graph/Edge', { through: 'orderedEdgeNodes', source: 'edge' })
  public edgesOrderedByPosition: GraphEdge[]

  @Node.HasMany('Graph/EdgeNode', { foreignKey: 'nodeId', selfWhereNot: { position: 'omittedEdgePosition' } })
  public nonOmittedPositionEdgeNodes: EdgeNode[]

  @Node.HasMany('Graph/Edge', { through: 'nonOmittedPositionEdgeNodes', source: 'edge' })
  public nonOmittedPositionEdges: GraphEdge[]

  @Node.HasMany('Graph/Edge', {
    through: 'edgeNodes',
    source: 'edge',
    selfWhereNot: { name: 'name' },
  })
  public nonNodeNameEdgesOnThroughAssociation: GraphEdge[]
}
