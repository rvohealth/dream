import Decorators from '../../../../src/decorators/Decorators.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import GraphNodeSerializer from '../../serializers/Graph/NodeSerializer.js'
import ApplicationModel from '../ApplicationModel.js'
import GraphEdge from './Edge.js'
import EdgeNode from './EdgeNode.js'

const deco = new Decorators<typeof Node>()

export default class Node extends ApplicationModel {
  public override get table() {
    return 'graph_nodes' as const
  }

  public get serializers() {
    return { default: GraphNodeSerializer }
  }

  public id: DreamColumn<Node, 'id'>
  public name: DreamColumn<Node, 'name'>
  public omittedEdgePosition: DreamColumn<Node, 'omittedEdgePosition'>
  public createdAt: DreamColumn<Node, 'createdAt'>
  public updatedAt: DreamColumn<Node, 'updatedAt'>

  @deco.HasMany('Graph/EdgeNode', { on: 'nodeId' })
  public edgeNodes: EdgeNode[]

  @deco.HasMany('Graph/EdgeNode', { on: 'nodeId', order: 'position' })
  public orderedEdgeNodes: EdgeNode[]

  @deco.HasMany('Graph/Edge', { through: 'edgeNodes' })
  public edges: GraphEdge[]

  @deco.HasMany('Graph/Edge', {
    through: 'edgeNodes',
    source: 'edge',
  })
  public edgesWithAliasedPreloads: GraphEdge[]

  @deco.HasMany('Graph/Edge', { through: 'edgeNodes', order: 'name', source: 'edge' })
  public edgesOrderedByName: GraphEdge[]

  @deco.HasMany('Graph/Edge', { through: 'orderedEdgeNodes', source: 'edge' })
  public edgesOrderedByPosition: GraphEdge[]

  @deco.HasMany('Graph/EdgeNode', {
    on: 'nodeId',
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
