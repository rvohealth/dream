import { DateTime } from 'luxon'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import { IdType } from '../../../src/dream/types'
import User from './User'
import ApplicationModel from './ApplicationModel'

export default class UserSettings extends ApplicationModel {
  public get table() {
    return 'user_settings' as const
  }

  public id: IdType
  public likesChalupas: boolean
  public createdAt: DateTime
  public updatedAt: DateTime

  @BelongsTo(() => User)
  public user: User
  public userId: IdType
}
