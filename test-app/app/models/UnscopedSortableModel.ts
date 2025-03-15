import { Decorators, DreamColumn } from '../../../src/index.js'
import ApplicationModel from './ApplicationModel.js'

const Deco = new Decorators<InstanceType<typeof UnscopedSortableModel>>()

export default class UnscopedSortableModel extends ApplicationModel {
  public get table() {
    return 'unscoped_sortable_models' as const
  }

  public id: DreamColumn<UnscopedSortableModel, 'id'>
  public createdAt: DreamColumn<UnscopedSortableModel, 'createdAt'>
  public updatedAt: DreamColumn<UnscopedSortableModel, 'updatedAt'>

  @Deco.Sortable()
  public position: DreamColumn<UnscopedSortableModel, 'position'>
}
