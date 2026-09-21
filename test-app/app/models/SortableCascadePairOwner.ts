import SoftDelete from '../../../src/decorators/class/SoftDelete.js'
import Decorators from '../../../src/decorators/Decorators.js'
import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import SortableCascadePair from './SortableCascadePair.js'

const deco = new Decorators<typeof SortableCascadePairOwner>()

/**
 * Two `dependent: 'destroy'` edges into one sort scope, and a level of depth
 * above them — the shape every other cascade fixture lacks.
 *
 * `SortableCascadePair`'s sort scope is `['owner', 'coOwner']`, and both of its
 * foreign keys point back here, so `ownedPairs` and `coOwnedPairs` each satisfy
 * the whole-scope rule on their own and each restores optimistically. A pair
 * naming one owner twice is reached by both edges; a pair naming two owners is
 * reached by one edge from each of them.
 *
 * `subOwners` puts a second level under all of that, so a cascade here restores
 * a grandchild scope through an edge one level down and then reaches the same
 * rows again through an edge at this level.
 */
@SoftDelete()
export default class SortableCascadePairOwner extends ApplicationModel {
  public override get table() {
    return 'sortable_cascade_pair_owners' as const
  }

  public id: DreamColumn<SortableCascadePairOwner, 'id'>
  public createdAt: DreamColumn<SortableCascadePairOwner, 'createdAt'>
  public updatedAt: DreamColumn<SortableCascadePairOwner, 'updatedAt'>
  public deletedAt: DreamColumn<SortableCascadePairOwner, 'deletedAt'>

  @deco.BelongsTo('SortableCascadePairOwner', { on: 'parentId', optional: true })
  public parent: SortableCascadePairOwner | null
  public parentId: DreamColumn<SortableCascadePairOwner, 'parentId'>

  @deco.HasMany('SortableCascadePairOwner', { on: 'parentId', dependent: 'destroy' })
  public subOwners: SortableCascadePairOwner[]

  @deco.HasMany('SortableCascadePair', { on: 'ownerId', dependent: 'destroy' })
  public ownedPairs: SortableCascadePair[]

  @deco.HasMany('SortableCascadePair', { on: 'coOwnerId', dependent: 'destroy' })
  public coOwnedPairs: SortableCascadePair[]
}
