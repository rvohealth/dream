import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'

export default class RatingSerializer extends DreamSerializer {
  @Attribute()
  public id: any
}
