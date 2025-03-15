import DreamSerializer from '../../../src/serializer.js'
import Attribute from '../../../src/serializer/decorators/attribute.js'

export default class BalloonLineSerializer extends DreamSerializer {
  @Attribute()
  public balloon: any

  @Attribute()
  public material: any

  @Attribute('date')
  public createdAt: any
}
