import Decorators from '../../../src/decorators/Decorators.js'
import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import SortableCascadeOwner from './SortableCascadeOwner.js'

const deco = new Decorators<typeof SortableCascadeLeaf>()

/**
 * The bug note's own shape: one sortable field, scoped on the foreign key a
 * `dependent: 'destroy'` cascade reaches it by. A cascade through
 * `SortableCascadeOwner#leaves` takes no Sortable scope lock at all.
 *
 * Deliberately not soft deleted, and deliberately carrying no default scope, so
 * that the cascade-qualifies rule is exercised against a model with nothing to
 * hide a row from the cascade's load rather than only against a soft-deleted
 * one.
 */
export default class SortableCascadeLeaf extends ApplicationModel {
  public override get table() {
    return 'sortable_cascade_leaves' as const
  }

  public id: DreamColumn<SortableCascadeLeaf, 'id'>
  public createdAt: DreamColumn<SortableCascadeLeaf, 'createdAt'>
  public updatedAt: DreamColumn<SortableCascadeLeaf, 'updatedAt'>

  @deco.Sortable({ scope: 'owner' })
  public position: DreamColumn<SortableCascadeLeaf, 'position'>

  @deco.BelongsTo('SortableCascadeOwner', { on: 'ownerId' })
  public owner: SortableCascadeOwner
  public ownerId: DreamColumn<SortableCascadeLeaf, 'ownerId'>
}
