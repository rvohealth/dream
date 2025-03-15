import DreamSerializer from '../../../src/serializer.js'
import Attribute from '../../../src/serializer/decorators/attribute.js'

export default class BalloonSummarySerializer extends DreamSerializer {
  @Attribute('string')
  public type: string

  @Attribute()
  public name: string
}
