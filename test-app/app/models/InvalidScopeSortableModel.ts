import { Decorators, DreamColumn } from '../../../src/index.js'
import ApplicationModel from './ApplicationModel.js'

const deco = new Decorators<InstanceType<typeof InvalidScopeSortableModel>>()

export default class InvalidScopeSortableModel extends ApplicationModel {
  public override get table() {
    return 'invalid_scope_sortable_models' as const
  }

  public id: DreamColumn<InvalidScopeSortableModel, 'id'>
  public createdAt: DreamColumn<InvalidScopeSortableModel, 'createdAt'>
  public updatedAt: DreamColumn<InvalidScopeSortableModel, 'updatedAt'>

  @deco.Sortable({ scope: 'intentionallyInvalidScope' } as any)
  public position: DreamColumn<InvalidScopeSortableModel, 'position'>
}
