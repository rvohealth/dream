import { DateTime } from 'luxon'
import Dream from '../../../src/dream'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import { IdType } from '../../../src/db/reflections'
import CollarSerializer from '../../../test-app/app/serializers/CollarSerializer'
import Pet from './Pet'

export default class Collar extends Dream {
  public get table() {
    return 'collars' as const
  }

  public get serializer() {
    return CollarSerializer
  }

  public id: IdType
  public lost: boolean
  public created_at: DateTime
  public updated_at: DateTime

  @BelongsTo(() => Pet)
  public pet: Pet
  public pet_id: IdType
}
