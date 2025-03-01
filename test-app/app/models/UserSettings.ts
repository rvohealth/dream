import { Decorators } from '../../../src'
import { DreamColumn, DreamSerializers } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import User from './User'

const Decorator = new Decorators<UserSettings>()

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

  @Decorator.BelongsTo('User')
  public user: User
  public userId: DreamColumn<UserSettings, 'userId'>
}
