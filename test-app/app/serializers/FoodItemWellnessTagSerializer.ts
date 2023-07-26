import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'

export default class FoodItemWellnessTagSerializer extends DreamSerializer {
  @Attribute()
  public FoodItem: any

  @Attribute()
  public WellnessTag: any
}
