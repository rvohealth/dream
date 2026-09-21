import SoftDelete from '../../../src/decorators/class/SoftDelete.js'
import Decorators from '../../../src/decorators/Decorators.js'
import DreamTransaction from '../../../src/dream/DreamTransaction.js'
import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import SortableCascadeOwner from './SortableCascadeOwner.js'

const deco = new Decorators<typeof SortableCascadeChild>()

/**
 * Three sortable fields under one owner:
 *
 * - `position` is scoped on the foreign key a cascade from the owner reaches
 *   this record by, so the cascade takes its whole sort scope with it
 * - `positionWithinLabel` adds a plain column, which only partitions that same
 *   set further
 * - `positionAcrossOwners` is scoped on the plain column alone, so its sort
 *   scopes span owners and survive the cascade
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

  /**
   * Runs from this record's `afterUpdate` hook, with the transaction that
   * updated it. Specs set it to interfere with a cascaded undestroy from inside
   * the cascade, and clear it when they are done.
   */
  public static afterUpdateCallback:
    | ((child: SortableCascadeChild, txn: DreamTransaction<any>) => Promise<void>)
    | null = null

  @deco.AfterUpdate()
  public async runAfterUpdateCallback(txn?: DreamTransaction<any> | null): Promise<void> {
    if (txn && SortableCascadeChild.afterUpdateCallback) {
      await SortableCascadeChild.afterUpdateCallback(this, txn)
    }
  }
}
