import { DateTime } from 'luxon'
import Dream from '../../../../src/dream'
import { IdType } from '../../../../src/db/reflections'
import BelongsTo from '../../../../src/decorators/associations/belongs-to'
import GraphEdgeNodeSerializer from '../../../../test-app/app/serializers/Graph/EdgeNodeSerializer'
import GraphEdge from './Edge'
import GraphNode from './Node'

export default class EdgeNode extends Dream {
  public get table() {
    return 'graph_edge_nodes' as const
  }

  public get serializer() {
    return GraphEdgeNodeSerializer
  }

  public id: IdType
  public created_at: DateTime
  public updated_at: DateTime

  @BelongsTo(() => GraphEdge, { foreignKey: 'edge_id' })
  public edge: GraphEdge
  public edge_id: IdType

  @BelongsTo(() => GraphNode, { foreignKey: 'node_id' })
  public node: GraphNode
  public node_id: IdType
}
