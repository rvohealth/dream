import Decorators from '../../../src/decorators/Decorators.js'
import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'

const deco = new Decorators<typeof UnscopedSortableModel>()

export default class UnscopedSortableModel extends ApplicationModel {
  public override get table() {
    return 'unscoped_sortable_models' as const
  }

  public id: DreamColumn<UnscopedSortableModel, 'id'>
  public createdAt: DreamColumn<UnscopedSortableModel, 'createdAt'>
  public updatedAt: DreamColumn<UnscopedSortableModel, 'updatedAt'>

  @deco.Sortable()
  public position: DreamColumn<UnscopedSortableModel, 'position'>
}
