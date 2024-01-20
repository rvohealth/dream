import DreamSerializer from '../../../../src/serializer'
import Attribute from '../../../../src/serializer/decorators/attribute'

export default class GraphEdgeSerializer extends DreamSerializer {
  @Attribute('string')
  public name: string
}
