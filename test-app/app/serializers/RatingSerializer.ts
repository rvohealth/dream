import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'
import RendersOne from '../../../src/serializer/decorators/associations/renders-one'

export default class RatingSerializer extends DreamSerializer {
  @Attribute()
  public id: any
}
