import { Decorators } from '../../../../src/index.js'
import { DreamColumn, DreamSerializers } from '../../../../src/types/dream.js'
import ApplicationModel from '../ApplicationModel.js'
import EdgeNode from './EdgeNode.js'
import GraphNode from './Node.js'

const deco = new Decorators<InstanceType<typeof Edge>>()

export default class Edge extends ApplicationModel {
  public override get table() {
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

  @deco.HasMany('Graph/EdgeNode', { foreignKey: 'edgeId' })
  public edgeNodes: EdgeNode[]

  @deco.HasMany('Graph/Node', { through: 'edgeNodes' })
  public nodes: GraphNode[]
}
