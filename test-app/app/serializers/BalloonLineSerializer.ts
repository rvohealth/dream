import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'

export default class BalloonLineSerializer extends DreamSerializer {
  @Attribute()
  public balloon: any

  @Attribute()
  public material: any
}
