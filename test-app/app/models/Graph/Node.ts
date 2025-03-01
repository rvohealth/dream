import { Decorators } from '../../../../src'
import { DreamColumn, DreamSerializers } from '../../../../src/dream/types'
import ApplicationModel from '../ApplicationModel'
import GraphEdge from './Edge'
import EdgeNode from './EdgeNode'

const Decorator = new Decorators<Node>()

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

  @Decorator.HasMany('Graph/EdgeNode', { foreignKey: 'nodeId' })
  public edgeNodes: EdgeNode[]

  @Decorator.HasMany('Graph/EdgeNode', { foreignKey: 'nodeId', order: 'position' })
  public orderedEdgeNodes: EdgeNode[]

  @Decorator.HasMany('Graph/Edge', { through: 'edgeNodes', preloadThroughColumns: ['position', 'createdAt'] })
  public edges: GraphEdge[]

  @Decorator.HasMany('Graph/Edge', {
    through: 'edgeNodes',
    preloadThroughColumns: { position: 'aliasedPosition', createdAt: 'aliasedCreatedAt' },
    source: 'edge',
  })
  public edgesWithAliasedPreloads: GraphEdge[]

  @Decorator.HasMany('Graph/Edge', { through: 'edgeNodes', order: 'name', source: 'edge' })
  public edgesOrderedByName: GraphEdge[]

  @Decorator.HasMany('Graph/Edge', { through: 'orderedEdgeNodes', source: 'edge' })
  public edgesOrderedByPosition: GraphEdge[]

  @Decorator.HasMany('Graph/EdgeNode', {
    foreignKey: 'nodeId',
    selfNotOn: { position: 'omittedEdgePosition' },
  })
  public nonOmittedPositionEdgeNodes: EdgeNode[]

  @Decorator.HasMany('Graph/Edge', { through: 'nonOmittedPositionEdgeNodes', source: 'edge' })
  public nonOmittedPositionEdges: GraphEdge[]

  @Decorator.HasMany('Graph/Edge', {
    through: 'edgeNodes',
    source: 'edge',
    selfNotOn: { name: 'name' },
  })
  public nonNodeNameEdgesOnThroughAssociation: GraphEdge[]
}
