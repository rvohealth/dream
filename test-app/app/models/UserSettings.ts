import { DateTime } from 'luxon'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import Dream from '../../../src/dream'
import { IdType } from '../../../src/db/reflections'
import User from './User'

export default class UserSettings extends Dream {
  public get table() {
    return 'user_settings' as const
  }

  public id: IdType
  public likes_chalupas: boolean
  public created_at: DateTime
  public updated_at: DateTime

  @BelongsTo(() => User)
  public user: User
  public user_id: IdType
}
