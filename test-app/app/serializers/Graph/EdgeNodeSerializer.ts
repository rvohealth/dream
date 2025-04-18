import Attribute from '../../../../src/serializer/decorators/attribute.js'
import DreamSerializer from '../../../../src/serializer/index.js'

export default class GraphEdgeNodeSerializer extends DreamSerializer {
  @Attribute()
  public graph_edge: any

  @Attribute()
  public graph_node: any
}
