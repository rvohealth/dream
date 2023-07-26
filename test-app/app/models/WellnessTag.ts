import { DateTime } from 'luxon'
import { IdType } from '../../../src/db/reflections'
import Dream from '../../../src/dream'
import WellnessTagSerializer from '../../../test-app/app/serializers/WellnessTagSerializer'

export default class WellnessTag extends Dream {
  public get table() {
    return 'wellness_tags' as const
  }

  public get serializer() {
    return WellnessTagSerializer
  }

  public id: IdType
  public name: string
  public created_at: DateTime
  public updated_at: DateTime
}
