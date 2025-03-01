import { Decorators } from '../../../src'
import { DreamColumn } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import User from './User'

const Decorator = new Decorators<IncompatibleForeignKeyTypeExample>()

export default class IncompatibleForeignKeyTypeExample extends ApplicationModel {
  public get table() {
    return 'incompatible_foreign_key_type_examples' as const
  }

  public id: DreamColumn<IncompatibleForeignKeyTypeExample, 'id'>
  public createdAt: DreamColumn<IncompatibleForeignKeyTypeExample, 'createdAt'>
  public updatedAt: DreamColumn<IncompatibleForeignKeyTypeExample, 'updatedAt'>

  @Decorator.BelongsTo('User')
  public user: User
  public userId: DreamColumn<IncompatibleForeignKeyTypeExample, 'userId'>
}
