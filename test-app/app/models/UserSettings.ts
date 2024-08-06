import BelongsTo from '../../../src/decorators/associations/belongs-to'
import { DreamColumn } from '../../../src/dream/types'
import User from './User'
import ApplicationModel from './ApplicationModel'

export default class UserSettings extends ApplicationModel {
  public get table() {
    return 'user_settings' as const
  }

  public id: DreamColumn<UserSettings, 'id'>
  public likesChalupas: DreamColumn<UserSettings, 'likesChalupas'>
  public createdAt: DreamColumn<UserSettings, 'createdAt'>
  public updatedAt: DreamColumn<UserSettings, 'updatedAt'>

  @BelongsTo(() => User)
  public user: User
  public userId: DreamColumn<UserSettings, 'userId'>
}

// intentionally left without serializers
