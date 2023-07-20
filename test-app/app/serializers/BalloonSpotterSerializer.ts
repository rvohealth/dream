import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'

export default class BalloonSpotterSerializer extends DreamSerializer {
  @Attribute()
  public name: string
}
