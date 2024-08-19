import DreamSerializer from '../../../src/serializer'
import RendersOne from '../../../src/serializer/decorators/associations/renders-one'
import Attribute from '../../../src/serializer/decorators/attribute'
import BalloonSummarySerializer from './BalloonSummarySerializer'

export default class BalloonSpotterBalloonSerializer extends DreamSerializer {
  @Attribute()
  public balloonSpotter: any

  @RendersOne(BalloonSummarySerializer)
  public balloon: any

  // intentional bad association to make sure that our type generators
  // don't crash upon reading
  @RendersOne()
  public gobbledeegook: any
}
