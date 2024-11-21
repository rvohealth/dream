import DreamSerializer from '../../../src/serializer'
import RendersMany from '../../../src/serializer/decorators/associations/RendersMany'
import Attribute from '../../../src/serializer/decorators/attribute'
import Balloon from '../models/Balloon'
import BalloonSummarySerializer from './BalloonSummarySerializer'

export default class BalloonSpotterSerializer extends DreamSerializer {
  @Attribute()
  public name: string

  @RendersMany(() => BalloonSummarySerializer)
  public balloons: Balloon[]
}
