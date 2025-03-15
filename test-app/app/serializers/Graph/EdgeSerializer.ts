import DreamSerializer from '../../../../src/serializer.js'
import Attribute from '../../../../src/serializer/decorators/attribute.js'

export default class GraphEdgeSerializer extends DreamSerializer {
  @Attribute('string')
  public name: string
}
