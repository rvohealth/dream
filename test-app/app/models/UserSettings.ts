import { DreamColumn, DreamSerializers } from '../../../src/dream/types.js'
import { Decorators } from '../../../src/index.js'
import ApplicationModel from './ApplicationModel.js'
import User from './User.js'

const Deco = new Decorators<InstanceType<typeof UserSettings>>()

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

  @Deco.BelongsTo('User')
  public user: User
  public userId: DreamColumn<UserSettings, 'userId'>
}
