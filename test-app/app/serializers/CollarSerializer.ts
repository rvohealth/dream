import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'

export default class CollarSerializer extends DreamSerializer {
  @Attribute()
  public pet: any

  @Attribute()
  public lost: any
}
