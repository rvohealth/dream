import { DateTime } from 'luxon'
import Dream from '../../../src/dream'
import { IdType } from '../../../src/db/reflections'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import User from './User'
import { BalloonColorEnum } from '../../db/schema'

export default class Balloon extends Dream {
  public get table() {
    return 'balloons' as const
  }

  public id: IdType
  public type: string
  public color: BalloonColorEnum
  public created_at: DateTime
  public updated_at: DateTime

  @BelongsTo(() => User)
  public user: User
  public user_id: IdType
}
