import BelongsTo from '../../../src/decorators/associations/belongs-to'
import { DreamColumn, DreamSerializers } from '../../../src/dream/types'
import User from './User'
import ApplicationModel from './ApplicationModel'

export default class UserSettings extends ApplicationModel {
  public get table() {
    return 'user_settings' as const
  }

  public get serializers(): DreamSerializers<UserSettings> {
    throw new Error(`
This is an intentional error meant to test generateApiSchemaContent
In wellos-central, a model exists that raises an exception if you
intentionally try to call .serializers on it.`)
  }

  public id: DreamColumn<UserSettings, 'id'>
  public likesChalupas: DreamColumn<UserSettings, 'likesChalupas'>
  public createdAt: DreamColumn<UserSettings, 'createdAt'>
  public updatedAt: DreamColumn<UserSettings, 'updatedAt'>

  @BelongsTo(() => User)
  public user: User
  public userId: DreamColumn<UserSettings, 'userId'>
}
