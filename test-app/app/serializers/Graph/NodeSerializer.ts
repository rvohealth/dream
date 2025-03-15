import DreamSerializer from '../../../../src/serializer.js'
import Attribute from '../../../../src/serializer/decorators/attribute.js'

export default class GraphNodeSerializer extends DreamSerializer {
  @Attribute()
  public name: string
}
