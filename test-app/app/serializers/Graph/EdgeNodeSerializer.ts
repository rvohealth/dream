import DreamSerializer from '../../../../src/serializer.js'
import Attribute from '../../../../src/serializer/decorators/attribute.js'

export default class GraphEdgeNodeSerializer extends DreamSerializer {
  @Attribute()
  public graph_edge: any

  @Attribute()
  public graph_node: any
}
