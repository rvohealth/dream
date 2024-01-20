import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'
import RendersMany from '../../../src/serializer/decorators/associations/renders-many'
import BalloonSummarySerializer from './BalloonSummarySerializer'
import Balloon from '../models/Balloon'

export default class BalloonSpotterSerializer extends DreamSerializer {
  @Attribute()
  public name: string

  @RendersMany(() => BalloonSummarySerializer)
  public balloons: Balloon[]
}
