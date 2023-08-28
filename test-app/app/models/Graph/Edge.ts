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
  public createdAt: DateTime
  public updatedAt: DateTime

  @HasMany(() => EdgeNode, { foreignKey: 'edgeId' })
  public edgeNodes: EdgeNode[]

  @HasMany(() => GraphNode, { through: 'edgeNodes' })
  public nodes: GraphNode[]
}
