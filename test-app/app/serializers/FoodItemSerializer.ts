import { IdType } from '../../../src/db/reflections'
import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'

export default class FoodItemSerializer extends DreamSerializer {
  @Attribute()
  public calories: number

  @Attribute()
  public external_nutrition_id: string
}
