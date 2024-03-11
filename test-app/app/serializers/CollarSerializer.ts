import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'
import RendersOne from '../../../src/serializer/decorators/associations/renders-one'

export default class CollarSerializer extends DreamSerializer {
  @Attribute()
  public id: any

  @Attribute()
  public lost: any

  @RendersOne()
  public pet: any
}
