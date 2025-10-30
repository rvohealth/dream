import Decorators from '../../../src/decorators/Decorators.js'
import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import User from './User.js'

const deco = new Decorators<typeof IncompatibleForeignKeyTypeExample>()

export default class IncompatibleForeignKeyTypeExample extends ApplicationModel {
  public override get table() {
    return 'incompatible_foreign_key_type_examples' as const
  }

  public id: DreamColumn<IncompatibleForeignKeyTypeExample, 'id'>
  public createdAt: DreamColumn<IncompatibleForeignKeyTypeExample, 'createdAt'>
  public updatedAt: DreamColumn<IncompatibleForeignKeyTypeExample, 'updatedAt'>

  @deco.BelongsTo('User')
  public user: User
  public userId: DreamColumn<IncompatibleForeignKeyTypeExample, 'userId'>
}
