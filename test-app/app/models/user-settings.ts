import BelongsTo from '../../../src/decorators/associations/belongs-to'
import Dream from '../../../src/dream'
import User from './user'

export default class UserSettings extends Dream {
  public get table() {
    return 'user_settings' as const
  }

  public id: number
  public likes_chalupas: boolean

  @BelongsTo(() => User)
  public user: User
  public user_id: number
}
