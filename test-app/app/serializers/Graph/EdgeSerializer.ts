import Attribute from '../../../../src/serializer/decorators/attribute.js'
import DreamSerializer from '../../../../src/serializer/index.js'

export default class GraphEdgeSerializer extends DreamSerializer {
  @Attribute('string')
  public name: string
}
