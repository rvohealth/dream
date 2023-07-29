import { DateTime } from 'luxon'
import Dream from '../../../src/dream'
import { IdType } from '../../../src/dream/types'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import User from './User'

export default class IncompatibleForeignKeyTypeExample extends Dream {
  public get table() {
    return 'incompatible_foreign_key_type_examples' as const
  }

  public id: IdType
  public created_at: DateTime
  public updated_at: DateTime

  @BelongsTo(() => User)
  public user: User
  public user_id: number
}
