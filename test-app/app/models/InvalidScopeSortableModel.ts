import { DreamColumn, Sortable } from '../../../src'
import ApplicationModel from './ApplicationModel'

export default class InvalidScopeSortableModel extends ApplicationModel {
  public get table() {
    return 'invalid_scope_sortable_models' as const
  }

  public id: DreamColumn<InvalidScopeSortableModel, 'id'>
  public createdAt: DreamColumn<InvalidScopeSortableModel, 'createdAt'>
  public updatedAt: DreamColumn<InvalidScopeSortableModel, 'updatedAt'>

  @Sortable({ scope: 'intentionallyInvalidScope' })
  public position: DreamColumn<InvalidScopeSortableModel, 'position'>
}
