import { DreamColumn, DreamSerializers } from '../../../../src/dream/types'

import { Decorators, SoftDelete } from '../../../../src'
import ApplicationModel from '../ApplicationModel'
import GraphEdge from './Edge'
import GraphNode from './Node'

const Deco = new Decorators<InstanceType<typeof EdgeNode>>()

@SoftDelete()
export default class EdgeNode extends ApplicationModel {
  public get table() {
    return 'graph_edge_nodes' as const
  }

  public get serializers(): DreamSerializers<EdgeNode> {
    return { default: 'Graph/EdgeNodeSerializer' }
  }

  public id: DreamColumn<EdgeNode, 'id'>
  public createdAt: DreamColumn<EdgeNode, 'createdAt'>
  public updatedAt: DreamColumn<EdgeNode, 'updatedAt'>
  public deletedAt: DreamColumn<EdgeNode, 'deletedAt'>

  @Deco.Sortable({ scope: 'node' })
  public position: DreamColumn<EdgeNode, 'position'>

  @Deco.Sortable({ scope: ['edge', 'node'] })
  public multiScopedPosition: DreamColumn<EdgeNode, 'multiScopedPosition'>

  @Deco.BelongsTo('Graph/Edge', { foreignKey: 'edgeId' })
  public edge: GraphEdge
  public edgeId: DreamColumn<EdgeNode, 'edgeId'>

  @Deco.BelongsTo('Graph/Node', { foreignKey: 'nodeId' })
  public node: GraphNode
  public nodeId: DreamColumn<EdgeNode, 'nodeId'>

  @Deco.HasMany('Graph/EdgeNode', {
    through: 'node',
    source: 'edgeNodes',
  })
  public siblingsIncludingMe: EdgeNode[]

  @Deco.HasMany('Graph/EdgeNode', {
    through: 'node',
    source: 'edgeNodes',
    selfNotOn: { id: 'id' },
  })
  public siblings: EdgeNode[]

  @Deco.HasMany('Graph/EdgeNode', {
    through: 'node',
    source: 'edgeNodes',
    order: 'position',
  })
  public orderedSiblings: EdgeNode[]

  @Deco.HasMany('Graph/EdgeNode', {
    through: 'node',
    source: 'orderedEdgeNodes',
  })
  public orderedSiblingsWithOrderOnSource: EdgeNode[]

  @Deco.HasOne('Graph/EdgeNode', {
    through: 'node',
    source: 'edgeNodes',
    selfOn: { id: 'id' },
  })
  public justThisSibling: EdgeNode

  @Deco.HasOne('Graph/EdgeNode', {
    through: 'node',
    source: 'edgeNodes',
    on: { position: 1 },
  })
  public headSibling: EdgeNode

  @Deco.HasMany('Graph/EdgeNode', {
    through: 'node',
    source: 'edgeNodes',
    notOn: { position: 1 },
  })
  public tailSiblings: EdgeNode[]
}
