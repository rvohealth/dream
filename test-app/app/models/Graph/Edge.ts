import { DateTime } from 'luxon'
import { IdType } from '../../../../src/dream/types'
import HasMany from '../../../../src/decorators/associations/has-many'
import GraphEdgeSerializer from '../../../../test-app/app/serializers/Graph/EdgeSerializer'
import EdgeNode from './EdgeNode'
import GraphNode from './Node'
import ApplicationModel from '../ApplicationModel'

export default class Edge extends ApplicationModel {
  public get table() {
    return 'graph_edges' as const
  }

  public get serializers() {
    return { default: GraphEdgeSerializer } as const
  }

  public id: IdType
  public name: string
  public weight: number
  public createdAt: DateTime
  public updatedAt: DateTime
  public preloadedThroughColumns: {
    position?: typeof EdgeNode.prototype.position
    createdAt?: typeof EdgeNode.prototype.createdAt
    aliasedPosition?: typeof EdgeNode.prototype.position
    aliasedCreatedAt?: typeof EdgeNode.prototype.createdAt
  } = {}

  @HasMany(() => EdgeNode, { foreignKey: 'edgeId' })
  public edgeNodes: EdgeNode[]

  @HasMany(() => GraphNode, { through: 'edgeNodes' })
  public nodes: GraphNode[]
}
