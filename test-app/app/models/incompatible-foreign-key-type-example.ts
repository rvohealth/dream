import { DateTime } from 'luxon'
import Dream from '../../../src/dream'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import User from './user'

export default class IncompatibleForeignKeyTypeExample extends Dream {
  public get table() {
    return 'incompatible_foreign_key_type_examples' as const
  }

  public id: number
  public created_at: DateTime
  public updated_at: DateTime

  @BelongsTo(() => User)
  public user: User
  public user_id: number
}
