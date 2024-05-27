import { DreamColumn } from '../../../src/dream/types'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import User from './User'
import ApplicationModel from './ApplicationModel'

export default class IncompatibleForeignKeyTypeExample extends ApplicationModel {
  public get table() {
    return 'incompatible_foreign_key_type_examples' as const
  }

  public id: DreamColumn<IncompatibleForeignKeyTypeExample, 'id'>
  public createdAt: DreamColumn<IncompatibleForeignKeyTypeExample, 'createdAt'>
  public updatedAt: DreamColumn<IncompatibleForeignKeyTypeExample, 'updatedAt'>

  @BelongsTo(() => User)
  public user: User
  public userId: DreamColumn<IncompatibleForeignKeyTypeExample, 'userId'>
}
