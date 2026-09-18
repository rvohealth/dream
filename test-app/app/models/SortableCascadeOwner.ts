import SoftDelete from '../../../src/decorators/class/SoftDelete.js'
import Decorators from '../../../src/decorators/Decorators.js'
import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import SortableCascadeChild from './SortableCascadeChild.js'
import SortableCascadeLeaf from './SortableCascadeLeaf.js'

const deco = new Decorators<typeof SortableCascadeOwner>()

/**
 * The owner of two sort scopes' worth of `dependent: 'destroy'` descendants.
 *
 * Destroying one of these is the shape the cascaded-destroy optimization is
 * about: every row of every sort scope below it is in the destroy set, so the
 * cascade takes no Sortable scope lock and performs no compaction for the
 * fields whose scope the edge's foreign key names.
 */
@SoftDelete()
export default class SortableCascadeOwner extends ApplicationModel {
  public override get table() {
    return 'sortable_cascade_owners' as const
  }

  public id: DreamColumn<SortableCascadeOwner, 'id'>
  public createdAt: DreamColumn<SortableCascadeOwner, 'createdAt'>
  public updatedAt: DreamColumn<SortableCascadeOwner, 'updatedAt'>
  public deletedAt: DreamColumn<SortableCascadeOwner, 'deletedAt'>

  @deco.HasMany('SortableCascadeChild', { on: 'ownerId', dependent: 'destroy' })
  public children: SortableCascadeChild[]

  @deco.HasMany('SortableCascadeLeaf', { on: 'ownerId', dependent: 'destroy' })
  public leaves: SortableCascadeLeaf[]

  /**
   * The same target as `children`, reached through an edge that destroys only
   * part of each sort scope. Nothing cascades through it; it exists so specs
   * can watch a conditioned edge fall back to today's locking.
   */
  @deco.HasMany('SortableCascadeChild', { on: 'ownerId', and: { label: 'a' } })
  public childrenLabeledA: SortableCascadeChild[]

  /**
   * A `HasOne` to the same target, for the same reason: one row of a scope that
   * may hold others, so its cascade leaves survivors.
   */
  @deco.HasOne('SortableCascadeChild', { on: 'ownerId' })
  public oneChild: SortableCascadeChild
}
