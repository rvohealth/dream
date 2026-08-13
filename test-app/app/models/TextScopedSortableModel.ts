import Decorators from '../../../src/decorators/Decorators.js'
import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'

const deco = new Decorators<typeof TextScopedSortableModel>()

/**
 * A sortable model whose sort scope is two ordinary, nullable text columns.
 *
 * Every other sortable model in the test app scopes on a foreign key, which
 * cannot carry a delimiter or an empty string, so nothing else here can express
 * two distinct sort scopes that a naive `values.join(':')` grouping would merge.
 */
export default class TextScopedSortableModel extends ApplicationModel {
  public override get table() {
    return 'text_scoped_sortable_models' as const
  }

  public id: DreamColumn<TextScopedSortableModel, 'id'>
  public scopeA: DreamColumn<TextScopedSortableModel, 'scopeA'>
  public scopeB: DreamColumn<TextScopedSortableModel, 'scopeB'>
  public createdAt: DreamColumn<TextScopedSortableModel, 'createdAt'>
  public updatedAt: DreamColumn<TextScopedSortableModel, 'updatedAt'>

  @deco.Sortable({ scope: ['scopeA', 'scopeB'] })
  public position: DreamColumn<TextScopedSortableModel, 'position'>
}
