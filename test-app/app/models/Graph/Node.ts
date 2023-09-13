import { DateTime } from 'luxon'
import { IdType } from '../../../../src/dream/types'
import HasMany from '../../../../src/decorators/associations/has-many'
import GraphNodeSerializer from '../../../../test-app/app/serializers/Graph/NodeSerializer'
import EdgeNode from './EdgeNode'
import GraphEdge from './Edge'
import ApplicationModel from '../ApplicationModel'

export default class Node extends ApplicationModel {
  public get table() {
    return 'graph_nodes' as const
  }

  public get serializer() {
    return GraphNodeSerializer
  }

  public id: IdType
  public name: string
  public createdAt: DateTime
  public updatedAt: DateTime

  @HasMany(() => EdgeNode, { foreignKey: 'nodeId' })
  public edgeNodes: EdgeNode[]

  @HasMany(() => GraphEdge, { through: 'edgeNodes' })
  public edges: GraphEdge[]
}
