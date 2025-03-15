import DreamSerializer from '../../../src/serializer.js'
import RendersMany from '../../../src/serializer/decorators/associations/RendersMany.js'
import Attribute from '../../../src/serializer/decorators/attribute.js'
import Balloon from '../models/Balloon.js'
import BalloonSummarySerializer from './BalloonSummarySerializer.js'

export default class BalloonSpotterSerializer extends DreamSerializer {
  @Attribute()
  public name: string

  @RendersMany(() => BalloonSummarySerializer)
  public balloons: Balloon[]
}
