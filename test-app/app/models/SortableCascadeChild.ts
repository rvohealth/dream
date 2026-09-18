import SoftDelete from '../../../src/decorators/class/SoftDelete.js'
import Decorators from '../../../src/decorators/Decorators.js'
import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import SortableCascadeOwner from './SortableCascadeOwner.js'

const deco = new Decorators<typeof SortableCascadeChild>()

/**
 * Three sortable fields under one owner, two of which a cascade through
 * `SortableCascadeOwner#children` takes the whole sort scope of:
 *
 * - `position` is scoped on the edge's own foreign key
 * - `positionWithinLabel` adds a plain column, which only partitions the same
 *   destroy set further
 * - `positionAcrossOwners` is scoped on that plain column alone, so its scopes
 *   span owners and survive the cascade
 *
 * SoftDelete is its only default scope, so nothing hides a row from the
 * cascade's own load.
 */
@SoftDelete()
export default class SortableCascadeChild extends ApplicationModel {
  public override get table() {
    return 'sortable_cascade_children' as const
  }

  public id: DreamColumn<SortableCascadeChild, 'id'>
  public label: DreamColumn<SortableCascadeChild, 'label'>
  public createdAt: DreamColumn<SortableCascadeChild, 'createdAt'>
  public updatedAt: DreamColumn<SortableCascadeChild, 'updatedAt'>
  public deletedAt: DreamColumn<SortableCascadeChild, 'deletedAt'>

  @deco.Sortable({ scope: 'owner' })
  public position: DreamColumn<SortableCascadeChild, 'position'>

  @deco.Sortable({ scope: ['owner', 'label'] })
  public positionWithinLabel: DreamColumn<SortableCascadeChild, 'positionWithinLabel'>

  @deco.Sortable({ scope: 'label' })
  public positionAcrossOwners: DreamColumn<SortableCascadeChild, 'positionAcrossOwners'>

  @deco.BelongsTo('SortableCascadeOwner', { on: 'ownerId' })
  public owner: SortableCascadeOwner
  public ownerId: DreamColumn<SortableCascadeChild, 'ownerId'>
}
