import { DateTime } from 'luxon'
import Dream from '../../../../src/dream'
import { IdType } from '../../../../src/dream/types'
import HasMany from '../../../../src/decorators/associations/has-many'
import GraphEdgeSerializer from '../../../../test-app/app/serializers/Graph/EdgeSerializer'
import EdgeNode from './EdgeNode'
import GraphNode from './Node'

export default class Edge extends Dream {
  public get table() {
    return 'graph_edges' as const
  }

  public get serializer() {
    return GraphEdgeSerializer
  }

  public id: IdType
  public name: string
  public created_at: DateTime
  public updated_at: DateTime

  @HasMany(() => EdgeNode, { foreignKey: 'edge_id' })
  public edgeNodes: EdgeNode[]

  @HasMany(() => GraphNode, { through: 'edgeNodes', source: 'node' })
  public nodes: GraphNode[]
}
