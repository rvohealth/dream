import SoftDelete from '../../../src/decorators/class/SoftDelete.js'
import Decorators from '../../../src/decorators/Decorators.js'
import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import SortableCascadePairOwner from './SortableCascadePairOwner.js'

const deco = new Decorators<typeof SortableCascadePair>()

/**
 * One sortable field whose scope is made of **two** foreign keys, each of which
 * a `dependent: 'destroy'` edge reaches this model by.
 *
 * Both edges therefore qualify for the optimistic restore — each one's foreign
 * key is a member of the scope — so a single cascade can renumber one of these
 * scopes through one edge and then reach the same rows again through the other.
 * Neither scope column is nullable, so nothing declines on that account.
 */
@SoftDelete()
export default class SortableCascadePair extends ApplicationModel {
  public override get table() {
    return 'sortable_cascade_pairs' as const
  }

  public id: DreamColumn<SortableCascadePair, 'id'>
  public createdAt: DreamColumn<SortableCascadePair, 'createdAt'>
  public updatedAt: DreamColumn<SortableCascadePair, 'updatedAt'>
  public deletedAt: DreamColumn<SortableCascadePair, 'deletedAt'>

  @deco.Sortable({ scope: ['owner', 'coOwner'] })
  public position: DreamColumn<SortableCascadePair, 'position'>

  @deco.BelongsTo('SortableCascadePairOwner', { on: 'ownerId' })
  public owner: SortableCascadePairOwner
  public ownerId: DreamColumn<SortableCascadePair, 'ownerId'>

  @deco.BelongsTo('SortableCascadePairOwner', { on: 'coOwnerId' })
  public coOwner: SortableCascadePairOwner
  public coOwnerId: DreamColumn<SortableCascadePair, 'coOwnerId'>
}
