import { DreamColumn, DreamSerializers } from '../../../../src/dream/types'

import { Decorators, SoftDelete } from '../../../../src'
import Sortable from '../../../../src/decorators/sortable/Sortable'
import ApplicationModel from '../ApplicationModel'
import GraphEdge from './Edge'
import GraphNode from './Node'

const Decorator = new Decorators<EdgeNode>()

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

  @Sortable({ scope: 'node' })
  public position: DreamColumn<EdgeNode, 'position'>

  @Sortable({ scope: ['edge', 'node'] })
  public multiScopedPosition: DreamColumn<EdgeNode, 'multiScopedPosition'>

  @Decorator.BelongsTo('Graph/Edge', { foreignKey: 'edgeId' })
  public edge: GraphEdge
  public edgeId: DreamColumn<EdgeNode, 'edgeId'>

  @Decorator.BelongsTo('Graph/Node', { foreignKey: 'nodeId' })
  public node: GraphNode
  public nodeId: DreamColumn<EdgeNode, 'nodeId'>

  @Decorator.HasMany('Graph/EdgeNode', {
    through: 'node',
    source: 'edgeNodes',
  })
  public siblingsIncludingMe: EdgeNode[]

  @Decorator.HasMany('Graph/EdgeNode', {
    through: 'node',
    source: 'edgeNodes',
    selfNotOn: { id: 'id' },
  })
  public siblings: EdgeNode[]

  @Decorator.HasMany('Graph/EdgeNode', {
    through: 'node',
    source: 'edgeNodes',
    order: 'position',
  })
  public orderedSiblings: EdgeNode[]

  @Decorator.HasMany('Graph/EdgeNode', {
    through: 'node',
    source: 'orderedEdgeNodes',
  })
  public orderedSiblingsWithOrderOnSource: EdgeNode[]

  @Decorator.HasOne('Graph/EdgeNode', {
    through: 'node',
    source: 'edgeNodes',
    selfOn: { id: 'id' },
  })
  public justThisSibling: EdgeNode

  @Decorator.HasOne('Graph/EdgeNode', {
    through: 'node',
    source: 'edgeNodes',
    on: { position: 1 },
  })
  public headSibling: EdgeNode

  @Decorator.HasMany('Graph/EdgeNode', {
    through: 'node',
    source: 'edgeNodes',
    notOn: { position: 1 },
  })
  public tailSiblings: EdgeNode[]
}
