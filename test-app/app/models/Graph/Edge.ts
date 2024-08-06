import { DreamColumn } from '../../../../src/dream/types'
import HasMany from '../../../../src/decorators/associations/has-many'
import GraphEdgeSerializer from '../../../../test-app/app/serializers/Graph/EdgeSerializer'
import EdgeNode from './EdgeNode'
import GraphNode from './Node'
import ApplicationModel from '../ApplicationModel'

export default class Edge extends ApplicationModel {
  public get table() {
    return 'graph_edges' as const
  }

  public id: DreamColumn<Edge, 'id'>
  public name: DreamColumn<Edge, 'name'>
  public weight: DreamColumn<Edge, 'weight'>
  public createdAt: DreamColumn<Edge, 'createdAt'>
  public updatedAt: DreamColumn<Edge, 'updatedAt'>
  public preloadedThroughColumns: {
    position?: DreamColumn<EdgeNode, 'position'>
    createdAt?: DreamColumn<EdgeNode, 'createdAt'>
    aliasedPosition?: DreamColumn<EdgeNode, 'position'>
    aliasedCreatedAt?: DreamColumn<EdgeNode, 'createdAt'>
  } = {}

  @HasMany(() => EdgeNode, { foreignKey: 'edgeId' })
  public edgeNodes: EdgeNode[]

  @HasMany(() => GraphNode, { through: 'edgeNodes' })
  public nodes: GraphNode[]
}

Edge.register('serializers', { default: GraphEdgeSerializer })
