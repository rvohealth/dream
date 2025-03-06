import { DreamColumn, Sortable } from '../../../src'
import ApplicationModel from './ApplicationModel'

export default class UnscopedSortableModel extends ApplicationModel {
  public get table() {
    return 'unscoped_sortable_models' as const
  }

  public id: DreamColumn<UnscopedSortableModel, 'id'>
  public createdAt: DreamColumn<UnscopedSortableModel, 'createdAt'>
  public updatedAt: DreamColumn<UnscopedSortableModel, 'updatedAt'>

  @Sortable()
  public position: DreamColumn<UnscopedSortableModel, 'position'>
}
