import { Decorators, DreamColumn } from '../../../src/index.js'
import ApplicationModel from './ApplicationModel.js'
import User from './User.js'

const deco = new Decorators<InstanceType<typeof InvalidAssociationSortableModel>>()

export default class InvalidAssociationSortableModel extends ApplicationModel {
  public get table() {
    return 'invalid_association_sortable_models' as const
  }

  public id: DreamColumn<InvalidAssociationSortableModel, 'id'>
  public createdAt: DreamColumn<InvalidAssociationSortableModel, 'createdAt'>
  public updatedAt: DreamColumn<InvalidAssociationSortableModel, 'updatedAt'>

  @deco.Sortable({ scope: 'users' } as any)
  public position: DreamColumn<InvalidAssociationSortableModel, 'position'>

  @deco.HasMany('User', { foreignKey: 'id' })
  public users: User[]
}
