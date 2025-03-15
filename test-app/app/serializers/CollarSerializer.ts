import DreamSerializer from '../../../src/serializer.js'
import RendersOne from '../../../src/serializer/decorators/associations/RendersOne.js'
import Attribute from '../../../src/serializer/decorators/attribute.js'

export default class CollarSerializer extends DreamSerializer {
  @Attribute()
  public id: any

  @Attribute()
  public lost: any

  @RendersOne()
  public pet: any
}
