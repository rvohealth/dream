import { DreamColumn } from '../../../../src/dream/types'
import BelongsTo from '../../../../src/decorators/associations/belongs-to'
import HasMany from '../../../../src/decorators/associations/has-many'
import HasOne from '../../../../src/decorators/associations/has-one'

import GraphEdgeNodeSerializer from '../../../../test-app/app/serializers/Graph/EdgeNodeSerializer'
import GraphEdge from './Edge'
import GraphNode from './Node'
import ApplicationModel from '../ApplicationModel'
import Sortable from '../../../../src/decorators/sortable'

export default class EdgeNode extends ApplicationModel {
  public get table() {
    return 'graph_edge_nodes' as const
  }

  public get serializers() {
    return { default: GraphEdgeNodeSerializer } as const
  }

  public id: DreamColumn<EdgeNode, 'id'>
  public createdAt: DreamColumn<EdgeNode, 'createdAt'>
  public updatedAt: DreamColumn<EdgeNode, 'updatedAt'>

  @Sortable({ scope: 'node' })
  public position: DreamColumn<EdgeNode, 'position'>

  @Sortable({ scope: ['edge', 'node'] })
  public multiScopedPosition: DreamColumn<EdgeNode, 'multiScopedPosition'>

  @BelongsTo(() => GraphEdge, { foreignKey: 'edgeId' })
  public edge: GraphEdge
  public edgeId: DreamColumn<EdgeNode, 'edgeId'>

  @BelongsTo(() => GraphNode, { foreignKey: 'nodeId' })
  public node: GraphNode
  public nodeId: DreamColumn<EdgeNode, 'nodeId'>

  @HasMany(() => EdgeNode, {
    through: 'node',
    source: 'edgeNodes',
  })
  public siblingsIncludingMe: EdgeNode[]

  @HasMany(() => EdgeNode, {
    through: 'node',
    source: 'edgeNodes',
    selfWhereNot: { id: 'id' },
  })
  public siblings: EdgeNode[]

  @HasMany(() => EdgeNode, {
    through: 'node',
    source: 'edgeNodes',
    order: 'position',
  })
  public orderedSiblings: EdgeNode[]

  @HasMany(() => EdgeNode, {
    through: 'node',
    source: 'orderedEdgeNodes',
  })
  public orderedSiblingsWithOrderOnSource: EdgeNode[]

  @HasOne(() => EdgeNode, {
    through: 'node',
    source: 'edgeNodes',
    selfWhere: { id: 'id' },
  })
  public justThisSibling: EdgeNode

  @HasOne(() => EdgeNode, {
    through: 'node',
    source: 'edgeNodes',
    where: { position: 1 },
  })
  public headSibling: EdgeNode

  @HasMany(() => EdgeNode, {
    through: 'node',
    source: 'edgeNodes',
    whereNot: { position: 1 },
  })
  public tailSiblings: EdgeNode[]
}
