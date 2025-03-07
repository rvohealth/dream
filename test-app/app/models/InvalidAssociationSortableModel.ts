import ApplicationModel from './ApplicationModel'
import { Decorators, DreamColumn, Sortable } from '../../../src'
import { Type } from '../../../src/dream/types'
import User from './User'

const Deco = new Decorators<Type<typeof InvalidAssociationSortableModel>>()

export default class InvalidAssociationSortableModel extends ApplicationModel {
  public get table() {
    return 'invalid_association_sortable_models' as const
  }

  public id: DreamColumn<InvalidAssociationSortableModel, 'id'>
  public createdAt: DreamColumn<InvalidAssociationSortableModel, 'createdAt'>
  public updatedAt: DreamColumn<InvalidAssociationSortableModel, 'updatedAt'>

  @Sortable({ scope: 'users' })
  public position: DreamColumn<InvalidAssociationSortableModel, 'position'>

  @Deco.HasMany('User', { foreignKey: 'id' })
  public users: User[]
}
