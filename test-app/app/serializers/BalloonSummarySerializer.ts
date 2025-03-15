import Attribute from '../../../src/serializer/decorators/attribute.js'
import DreamSerializer from '../../../src/serializer/index.js'

export default class BalloonSummarySerializer extends DreamSerializer {
  @Attribute('string')
  public type: string

  @Attribute()
  public name: string
}
