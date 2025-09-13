import { Decorators } from '../../../../src/index.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import GraphEdgeSerializer from '../../serializers/Graph/EdgeSerializer.js'
import ApplicationModel from '../ApplicationModel.js'
import EdgeNode from './EdgeNode.js'
import GraphNode from './Node.js'

const deco = new Decorators<typeof Edge>()

export default class Edge extends ApplicationModel {
  public override get table() {
    return 'graph_edges' as const
  }

  public get serializers() {
    return { default: GraphEdgeSerializer }
  }

  public id: DreamColumn<Edge, 'id'>
  public name: DreamColumn<Edge, 'name'>
  public weight: DreamColumn<Edge, 'weight'>
  public createdAt: DreamColumn<Edge, 'createdAt'>
  public updatedAt: DreamColumn<Edge, 'updatedAt'>

  @deco.HasMany('Graph/EdgeNode', { on: 'edgeId' })
  public edgeNodes: EdgeNode[]

  @deco.HasMany('Graph/Node', { through: 'edgeNodes' })
  public nodes: GraphNode[]
}
