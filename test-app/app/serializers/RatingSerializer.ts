import DreamSerializer from '../../../src/serializer.js'
import Attribute from '../../../src/serializer/decorators/attribute.js'

export default class RatingSerializer extends DreamSerializer {
  @Attribute()
  public id: any
}
