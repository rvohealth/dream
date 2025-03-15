import { Decorators, DreamColumn } from '../../../src/index.js'
import ApplicationModel from './ApplicationModel.js'

const Deco = new Decorators<InstanceType<typeof InvalidScopeSortableModel>>()

export default class InvalidScopeSortableModel extends ApplicationModel {
  public get table() {
    return 'invalid_scope_sortable_models' as const
  }

  public id: DreamColumn<InvalidScopeSortableModel, 'id'>
  public createdAt: DreamColumn<InvalidScopeSortableModel, 'createdAt'>
  public updatedAt: DreamColumn<InvalidScopeSortableModel, 'updatedAt'>

  @Deco.Sortable({ scope: 'intentionallyInvalidScope' } as any)
  public position: DreamColumn<InvalidScopeSortableModel, 'position'>
}
