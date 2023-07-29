import { DateTime } from 'luxon'
import Dream from '../../../../src/dream'
import { IdType } from '../../../../src/dream/types'
import HasMany from '../../../../src/decorators/associations/has-many'
import GraphNodeSerializer from '../../../../test-app/app/serializers/Graph/NodeSerializer'
import EdgeNode from './EdgeNode'
import GraphEdge from './Edge'

export default class Node extends Dream {
  public get table() {
    return 'graph_nodes' as const
  }

  public get serializer() {
    return GraphNodeSerializer
  }

  public id: IdType
  public name: string
  public created_at: DateTime
  public updated_at: DateTime

  @HasMany(() => EdgeNode, { foreignKey: 'node_id' })
  public edgeNodes: EdgeNode[]

  @HasMany(() => GraphEdge, { through: 'edgeNodes', source: 'edge' })
  public edges: GraphEdge[]
}
