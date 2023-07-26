import { DateTime } from 'luxon'
import { IdType } from '../../../src/db/reflections'
import Dream from '../../../src/dream'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import FoodItemWellnessTagSerializer from '../../../test-app/app/serializers/FoodItemWellnessTagSerializer'
import FoodItem from './FoodItem'
import WellnessTag from './WellnessTag'

export default class FoodItemWellnessTag extends Dream {
  public get table() {
    return 'food_item_wellness_tags' as const
  }

  public get serializer() {
    return FoodItemWellnessTagSerializer
  }

  public id: IdType
  public primary: boolean
  public created_at: DateTime
  public updated_at: DateTime

  @BelongsTo(() => FoodItem, { primaryKey: 'external_nutrition_id', foreignKey: 'external_nutrition_id' })
  public foodItem: FoodItem
  public external_nutrition_id: string

  @BelongsTo(() => WellnessTag)
  public wellnessTag: WellnessTag
  public wellness_tag_id: IdType
}
