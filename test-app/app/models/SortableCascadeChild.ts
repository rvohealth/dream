import SoftDelete from '../../../src/decorators/class/SoftDelete.js'
import Decorators from '../../../src/decorators/Decorators.js'
import DreamTransaction from '../../../src/dream/DreamTransaction.js'
import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import SortableCascadeOwner from './SortableCascadeOwner.js'

const deco = new Decorators<typeof SortableCascadeChild>()

/**
 * Four sortable fields under one owner, three of which a cascade through
 * `SortableCascadeOwner#children` takes the whole sort scope of:
 *
 * - `position` is scoped on the edge's own foreign key
 * - `positionWithinLabel` adds a plain column, which only partitions the same
 *   destroy set further
 * - `positionAcrossOwners` is scoped on that plain column alone, so its scopes
 *   span owners and survive the cascade
 * - `positionWithinGroup` adds a **nullable** plain column. It covers the whole
 *   scope like `positionWithinLabel` and so skips on a cascaded destroy, but a
 *   cascaded *undestroy* declines it: its deferrable unique constraint is NULLS
 *   DISTINCT, so a collision in a null-valued group would commit rather than
 *   abort, and the optimistic restore's clean-abort guarantee would be false
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
  public groupName: DreamColumn<SortableCascadeChild, 'groupName'>
  public createdAt: DreamColumn<SortableCascadeChild, 'createdAt'>
  public updatedAt: DreamColumn<SortableCascadeChild, 'updatedAt'>
  public deletedAt: DreamColumn<SortableCascadeChild, 'deletedAt'>

  @deco.Sortable({ scope: 'owner' })
  public position: DreamColumn<SortableCascadeChild, 'position'>

  @deco.Sortable({ scope: ['owner', 'label'] })
  public positionWithinLabel: DreamColumn<SortableCascadeChild, 'positionWithinLabel'>

  @deco.Sortable({ scope: 'label' })
  public positionAcrossOwners: DreamColumn<SortableCascadeChild, 'positionAcrossOwners'>

  @deco.Sortable({ scope: ['owner', 'groupName'] })
  public positionWithinGroup: DreamColumn<SortableCascadeChild, 'positionWithinGroup'>

  @deco.BelongsTo('SortableCascadeOwner', { on: 'ownerId' })
  public owner: SortableCascadeOwner
  public ownerId: DreamColumn<SortableCascadeChild, 'ownerId'>

  /**
   * The row's positions as an `afterUpdate` hook observed them, read back from
   * the database rather than off the in-memory instance. One entry per
   * invocation.
   *
   * A cascaded undestroy renumbers each restored sort scope once, at the end of
   * the cascade, so an `afterUpdate` hook on a restored record runs while that
   * record's optimistic positions are still NULL. This is what pins that
   * transient — it is a documented consequence of the restore, not an accident.
   * Specs that read it reset it first.
   */
  public static observedPositionsInAfterUpdate: (number | null)[][] = []

  /**
   * The positions the **in-memory instance** holds when its `afterUpdateCommit`
   * hook runs, which is after the transaction has committed. One entry per
   * invocation.
   *
   * This is the other half of the transient: whatever an `afterUpdate` hook saw
   * mid-cascade, the renumber and the instance refresh have both run by the time
   * a commit hook does, so nothing observes a NULL from outside the transaction.
   * Specs that read it reset it first.
   */
  public static observedPositionsInAfterUpdateCommit: (number | null)[][] = []

  @deco.AfterUpdate()
  public async recordsObservedPositions(txn?: DreamTransaction<any> | null): Promise<void> {
    if (!txn) return
    const row = await SortableCascadeChild.txn(txn).findOrFail(this.id)
    SortableCascadeChild.observedPositionsInAfterUpdate.push([
      row.position,
      row.positionWithinLabel,
      row.positionAcrossOwners,
      row.positionWithinGroup,
    ])
  }

  @deco.AfterUpdateCommit()
  public recordsObservedPositionsAfterCommit(): void {
    SortableCascadeChild.observedPositionsInAfterUpdateCommit.push([
      this.position,
      this.positionWithinLabel,
      this.positionAcrossOwners,
      this.positionWithinGroup,
    ])
  }
}
