import DreamSerializer from '../../../../src/serializer'
import Attribute from '../../../../src/serializer/decorators/attribute'

export default class GraphEdgeNodeSerializer extends DreamSerializer {
  @Attribute()
  public graph_edge: any

  @Attribute()
  public graph_node: any
}
