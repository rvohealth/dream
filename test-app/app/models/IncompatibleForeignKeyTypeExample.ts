import { DateTime } from 'luxon'
import { IdType } from '../../../src/dream/types'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import User from './User'
import ApplicationModel from './ApplicationModel'

export default class IncompatibleForeignKeyTypeExample extends ApplicationModel {
  public get table() {
    return 'incompatible_foreign_key_type_examples' as const
  }

  public id: IdType
  public createdAt: DateTime
  public updatedAt: DateTime

  @BelongsTo(() => User)
  public user: User
  public userId: number
}
