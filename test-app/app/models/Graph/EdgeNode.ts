import { DateTime } from 'luxon'
import { IdType } from '../../../../src/dream/types'
import BelongsTo from '../../../../src/decorators/associations/belongs-to'
import GraphEdgeNodeSerializer from '../../../../test-app/app/serializers/Graph/EdgeNodeSerializer'
import GraphEdge from './Edge'
import GraphNode from './Node'
import ApplicationModel from '../ApplicationModel'
import { Sortable } from '../../../../src'

export default class EdgeNode extends ApplicationModel {
  public get table() {
    return 'graph_edge_nodes' as const
  }

  public get serializer() {
    return GraphEdgeNodeSerializer
  }

  public id: IdType
  public createdAt: DateTime
  public updatedAt: DateTime

  @Sortable({ scope: ['edge', 'node'] })
  public position: number

  @BelongsTo(() => GraphEdge, { foreignKey: 'edgeId' })
  public edge: GraphEdge
  public edgeId: IdType

  @BelongsTo(() => GraphNode, { foreignKey: 'nodeId' })
  public node: GraphNode
  public nodeId: IdType
}
