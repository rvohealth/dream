import { DreamColumn } from '../../../../src/types/dream.js'

import { Decorators, SoftDelete } from '../../../../src/index.js'
import EdgeNodeSerializer from '../../serializers/Graph/EdgeNodeSerializer.js'
import ApplicationModel from '../ApplicationModel.js'
import GraphEdge from './Edge.js'
import GraphNode from './Node.js'

const deco = new Decorators<typeof EdgeNode>()

@SoftDelete()
export default class EdgeNode extends ApplicationModel {
  public override get table() {
    return 'graph_edge_nodes' as const
  }

  public get serializers() {
    return { default: EdgeNodeSerializer }
  }

  public id: DreamColumn<EdgeNode, 'id'>
  public createdAt: DreamColumn<EdgeNode, 'createdAt'>
  public updatedAt: DreamColumn<EdgeNode, 'updatedAt'>
  public deletedAt: DreamColumn<EdgeNode, 'deletedAt'>

  @deco.Sortable({ scope: 'node' })
  public position: DreamColumn<EdgeNode, 'position'>

  @deco.Sortable({ scope: ['edge', 'node'] })
  public multiScopedPosition: DreamColumn<EdgeNode, 'multiScopedPosition'>

  @deco.BelongsTo('Graph/Edge', { foreignKey: 'edgeId' })
  public edge: GraphEdge
  public edgeId: DreamColumn<EdgeNode, 'edgeId'>

  @deco.BelongsTo('Graph/Node', { foreignKey: 'nodeId' })
  public node: GraphNode
  public nodeId: DreamColumn<EdgeNode, 'nodeId'>

  @deco.HasMany('Graph/EdgeNode', {
    through: 'node',
    source: 'edgeNodes',
  })
  public siblingsIncludingMe: EdgeNode[]

  @deco.HasMany('Graph/EdgeNode', {
    through: 'node',
    source: 'edgeNodes',
    selfAndNot: { id: 'id' },
  })
  public siblings: EdgeNode[]

  @deco.HasMany('Graph/EdgeNode', {
    through: 'node',
    source: 'edgeNodes',
    order: 'position',
  })
  public orderedSiblings: EdgeNode[]

  @deco.HasMany('Graph/EdgeNode', {
    through: 'node',
    source: 'orderedEdgeNodes',
  })
  public orderedSiblingsWithOrderOnSource: EdgeNode[]

  @deco.HasOne('Graph/EdgeNode', {
    through: 'node',
    source: 'edgeNodes',
    selfAnd: { id: 'id' },
  })
  public justThisSibling: EdgeNode

  @deco.HasOne('Graph/EdgeNode', {
    through: 'node',
    source: 'edgeNodes',
    and: { position: 1 },
  })
  public headSibling: EdgeNode

  @deco.HasMany('Graph/EdgeNode', {
    through: 'node',
    source: 'edgeNodes',
    andNot: { position: 1 },
  })
  public tailSiblings: EdgeNode[]
}
