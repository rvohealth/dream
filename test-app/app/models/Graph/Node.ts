import { Decorators } from '../../../../src/index.js'
import { DreamColumn, DreamSerializers } from '../../../../src/types/dream.js'
import ApplicationModel from '../ApplicationModel.js'
import GraphEdge from './Edge.js'
import EdgeNode from './EdgeNode.js'

const deco = new Decorators<typeof Node>()

export default class Node extends ApplicationModel {
  public override get table() {
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

  @deco.HasMany('Graph/EdgeNode', { foreignKey: 'nodeId' })
  public edgeNodes: EdgeNode[]

  @deco.HasMany('Graph/EdgeNode', { foreignKey: 'nodeId', order: 'position' })
  public orderedEdgeNodes: EdgeNode[]

  @deco.HasMany('Graph/Edge', { through: 'edgeNodes', preloadThroughColumns: ['position', 'createdAt'] })
  public edges: GraphEdge[]

  @deco.HasMany('Graph/Edge', {
    through: 'edgeNodes',
    preloadThroughColumns: { position: 'aliasedPosition', createdAt: 'aliasedCreatedAt' },
    source: 'edge',
  })
  public edgesWithAliasedPreloads: GraphEdge[]

  @deco.HasMany('Graph/Edge', { through: 'edgeNodes', order: 'name', source: 'edge' })
  public edgesOrderedByName: GraphEdge[]

  @deco.HasMany('Graph/Edge', { through: 'orderedEdgeNodes', source: 'edge' })
  public edgesOrderedByPosition: GraphEdge[]

  @deco.HasMany('Graph/EdgeNode', {
    foreignKey: 'nodeId',
    selfAndNot: { position: 'omittedEdgePosition' },
  })
  public nonOmittedPositionEdgeNodes: EdgeNode[]

  @deco.HasMany('Graph/Edge', { through: 'nonOmittedPositionEdgeNodes', source: 'edge' })
  public nonOmittedPositionEdges: GraphEdge[]

  @deco.HasMany('Graph/Edge', {
    through: 'edgeNodes',
    source: 'edge',
    selfAndNot: { name: 'name' },
  })
  public nonNodeNameEdgesOnThroughAssociation: GraphEdge[]
}
