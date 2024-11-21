import DreamSerializer from '../../../src/serializer'
import RendersOne from '../../../src/serializer/decorators/associations/RendersOne'
import Attribute from '../../../src/serializer/decorators/attribute'

export default class CollarSerializer extends DreamSerializer {
  @Attribute()
  public id: any

  @Attribute()
  public lost: any

  @RendersOne()
  public pet: any
}
