import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'

export default class BalloonSpotterBalloonSerializer extends DreamSerializer {
  @Attribute()
  public BalloonSpotter: any

  @Attribute()
  public Balloon: any
}
