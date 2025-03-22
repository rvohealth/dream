import { Decorators } from '../../../../src/index.js'
import { DreamColumn, DreamSerializers } from '../../../../src/types/dream.js'
import ApplicationModel from '../ApplicationModel.js'
import GraphEdge from './Edge.js'
import EdgeNode from './EdgeNode.js'

const Deco = new Decorators<InstanceType<typeof Node>>()

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

  @Deco.HasMany('Graph/EdgeNode', { foreignKey: 'nodeId' })
  public edgeNodes: EdgeNode[]

  @Deco.HasMany('Graph/EdgeNode', { foreignKey: 'nodeId', order: 'position' })
  public orderedEdgeNodes: EdgeNode[]

  @Deco.HasMany('Graph/Edge', { through: 'edgeNodes', preloadThroughColumns: ['position', 'createdAt'] })
  public edges: GraphEdge[]

  @Deco.HasMany('Graph/Edge', {
    through: 'edgeNodes',
    preloadThroughColumns: { position: 'aliasedPosition', createdAt: 'aliasedCreatedAt' },
    source: 'edge',
  })
  public edgesWithAliasedPreloads: GraphEdge[]

  @Deco.HasMany('Graph/Edge', { through: 'edgeNodes', order: 'name', source: 'edge' })
  public edgesOrderedByName: GraphEdge[]

  @Deco.HasMany('Graph/Edge', { through: 'orderedEdgeNodes', source: 'edge' })
  public edgesOrderedByPosition: GraphEdge[]

  @Deco.HasMany('Graph/EdgeNode', {
    foreignKey: 'nodeId',
    selfNotOn: { position: 'omittedEdgePosition' },
  })
  public nonOmittedPositionEdgeNodes: EdgeNode[]

  @Deco.HasMany('Graph/Edge', { through: 'nonOmittedPositionEdgeNodes', source: 'edge' })
  public nonOmittedPositionEdges: GraphEdge[]

  @Deco.HasMany('Graph/Edge', {
    through: 'edgeNodes',
    source: 'edge',
    selfNotOn: { name: 'name' },
  })
  public nonNodeNameEdgesOnThroughAssociation: GraphEdge[]
}
