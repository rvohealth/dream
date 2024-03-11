import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'

export default class BalloonSummarySerializer extends DreamSerializer {
  @Attribute('type:BalloonTypesEnum')
  public type: string

  @Attribute()
  public name: string
}
