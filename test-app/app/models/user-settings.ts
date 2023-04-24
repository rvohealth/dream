import BelongsTo from '../../../src/decorators/associations/belongs-to'
import dream from '../../../src/dream'
import User from './user'

const Dream = dream('user_settings')
export default class UserSettings extends Dream {
  public id: number
  public likes_chalupas: boolean

  @BelongsTo(() => User)
  public user: User
  public user_id: number
}
