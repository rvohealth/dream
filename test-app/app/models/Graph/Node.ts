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

  public get serializers() {
    return { default: GraphNodeSerializer } as const
  }

  public id: IdType
  public name: string
  public omittedEdgePosition: number
  public createdAt: DateTime
  public updatedAt: DateTime

  @HasMany(() => EdgeNode, { foreignKey: 'nodeId' })
  public edgeNodes: EdgeNode[]

  @HasMany(() => EdgeNode, { foreignKey: 'nodeId', order: 'position' })
  public orderedEdgeNodes: EdgeNode[]

  @HasMany(() => GraphEdge, { through: 'edgeNodes', preloadThroughColumns: ['position', 'createdAt'] })
  public edges: GraphEdge[]

  @HasMany(() => GraphEdge, {
    through: 'edgeNodes',
    preloadThroughColumns: { position: 'aliasedPosition', createdAt: 'aliasedCreatedAt' },
    source: 'edge',
  })
  public edgesWithAliasedPreloads: GraphEdge[]

  @HasMany(() => GraphEdge, { through: 'edgeNodes', order: 'name', source: 'edge' })
  public edgesOrderedByName: GraphEdge[]

  @HasMany(() => GraphEdge, { through: 'orderedEdgeNodes', source: 'edge' })
  public edgesOrderedByPosition: GraphEdge[]

  @HasMany(() => EdgeNode, { foreignKey: 'nodeId', selfWhereNot: { position: 'omittedEdgePosition' } })
  public nonOmittedPositionEdgeNodes: EdgeNode[]

  @HasMany(() => GraphEdge, { through: 'nonOmittedPositionEdgeNodes', source: 'edge' })
  public nonOmittedPositionEdges: GraphEdge[]

  @HasMany(() => GraphEdge, {
    through: 'edgeNodes',
    source: 'edge',
    selfWhereNot: { name: 'name' },
  })
  public nonNodeNameEdgesOnThroughAssociation: GraphEdge[]
}
