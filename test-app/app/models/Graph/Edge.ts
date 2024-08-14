import HasMany from '../../../../src/decorators/associations/has-many'
import { DreamColumn, DreamSerializers } from '../../../../src/dream/types'
import ApplicationModel from '../ApplicationModel'
import EdgeNode from './EdgeNode'
import GraphNode from './Node'

export default class Edge extends ApplicationModel {
  public get table() {
    return 'graph_edges' as const
  }

  public get serializers(): DreamSerializers<Edge> {
    return { default: 'Graph/EdgeSerializer' }
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

  @HasMany('EdgeNode', { foreignKey: 'edgeId' })
  public edgeNodes: EdgeNode[]

  @HasMany('GraphNode', { through: 'edgeNodes' })
  public nodes: GraphNode[]
}
