import { DateTime } from 'luxon'
import Dream from '../../../src/dream'
import { IdType } from '../../../src/db/reflections'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import User from './User'
import { BalloonColorsEnum, BalloonTypesEnum } from '../../db/schema'
import { Validates } from '../../../src'

export default class Balloon extends Dream {
  public get table() {
    return 'balloons' as const
  }

  public id: IdType
  public type: BalloonTypesEnum
  public color: BalloonColorsEnum
  public created_at: DateTime
  public updated_at: DateTime

  @Validates('numericality', { min: 0, max: 100 })
  public volume: number

  @BelongsTo(() => User)
  public user: User
  public user_id: IdType
}
