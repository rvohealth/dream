import Attribute from '../../../../src/serializer/decorators/attribute.js'
import DreamSerializer from '../../../../src/serializer/index.js'

export default class GraphNodeSerializer extends DreamSerializer {
  @Attribute()
  public name: string
}
