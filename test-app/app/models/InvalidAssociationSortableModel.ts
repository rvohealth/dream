import Decorators from '../../../src/decorators/Decorators.js'
import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import User from './User.js'

const deco = new Decorators<typeof InvalidAssociationSortableModel>()

export default class InvalidAssociationSortableModel extends ApplicationModel {
  public override get table() {
    return 'invalid_association_sortable_models' as const
  }

  public id: DreamColumn<InvalidAssociationSortableModel, 'id'>
  public createdAt: DreamColumn<InvalidAssociationSortableModel, 'createdAt'>
  public updatedAt: DreamColumn<InvalidAssociationSortableModel, 'updatedAt'>

  @deco.Sortable({ scope: 'users' } as any)
  public position: DreamColumn<InvalidAssociationSortableModel, 'position'>

  @deco.HasMany('User', { on: 'id' })
  public users: User[]
}
