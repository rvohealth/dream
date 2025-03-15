import RendersOne from '../../../src/serializer/decorators/associations/RendersOne.js'
import Attribute from '../../../src/serializer/decorators/attribute.js'
import DreamSerializer from '../../../src/serializer/index.js'
import BalloonSummarySerializer from './BalloonSummarySerializer.js'

export default class BalloonSpotterBalloonSerializer extends DreamSerializer {
  @Attribute()
  public balloonSpotter: any

  @RendersOne(() => BalloonSummarySerializer)
  public balloon: any

  // intentional bad association to make sure that our type generators
  // don't crash upon reading
  @RendersOne()
  public gobbledeegook: any
}
