import SoftDelete from '../../../src/decorators/class/SoftDelete.js'
import Decorators from '../../../src/decorators/Decorators.js'
import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import SortableCascadeChild from './SortableCascadeChild.js'

const deco = new Decorators<typeof SortableCascadeOwner>()

/**
 * The owner of a sort scope's worth of `dependent: 'destroy'` descendants:
 * destroying or undestroying one of these cascades to every
 * `SortableCascadeChild` under it.
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

  /**
   * The same children through an edge that reaches only some of them. Nothing
   * cascades through it; it exists for specs of the whole-scope predicate.
   */
  @deco.HasMany('SortableCascadeChild', { on: 'ownerId', and: { label: 'a' } })
  public childrenLabeledA: SortableCascadeChild[]

  /**
   * One child through a `HasOne`, for the same reason.
   */
  @deco.HasOne('SortableCascadeChild', { on: 'ownerId' })
  public oneChild: SortableCascadeChild
}
