import { DateTime } from 'luxon'
import { IdType } from '../../../src/db/reflections'
import Dream from '../../../src/dream'
import FoodItemSerializer from '../../../test-app/app/serializers/FoodItemSerializer'
import HasMany from '../../../src/decorators/associations/has-many'
import HasOne from '../../../src/decorators/associations/has-one'
import FoodItemWellnessTag from './FoodItemWellnessTag'
import WellnessTag from './WellnessTag'

export default class FoodItem extends Dream {
  public get table() {
    return 'food_items' as const
  }

  public get serializer() {
    return FoodItemSerializer
  }

  @HasMany(() => FoodItemWellnessTag, {
    primaryKey: 'external_nutrition_id',
    foreignKey: 'external_nutrition_id',
  })
  public foodItemWellnessTags: FoodItemWellnessTag[]

  @HasMany(() => WellnessTag, {
    through: 'foodItemWellnessTags',
    source: 'wellnessTag',
  })
  public wellnessTags: WellnessTag[]

  @HasOne(() => FoodItemWellnessTag, {
    primaryKey: 'external_nutrition_id',
    foreignKey: 'external_nutrition_id',
    where: { primary: true },
  })
  public primaryFoodItemWellnessTag: FoodItemWellnessTag

  public id: IdType
  public name: string
  public calories: number
  public external_nutrition_id: string
  public created_at: DateTime
  public updated_at: DateTime
}
