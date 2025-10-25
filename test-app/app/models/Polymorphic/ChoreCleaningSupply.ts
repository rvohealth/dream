import Decorators from '../../../../src/decorators/Decorators.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import ApplicationModel from '../ApplicationModel.js'
import PolymorphicChore from './Chore.js'
import CleaningSupply from './CleaningSupply.js'

const deco = new Decorators<typeof ChoreCleaningSupply>()

export default class ChoreCleaningSupply extends ApplicationModel {
  public override get table() {
    return 'polymorphic_chore_cleaning_supplies' as const
  }

  public id: DreamColumn<ChoreCleaningSupply, 'id'>
  public createdAt: DreamColumn<ChoreCleaningSupply, 'createdAt'>
  public updatedAt: DreamColumn<ChoreCleaningSupply, 'updatedAt'>

  @deco.BelongsTo('Polymorphic/Chore')
  public chore: PolymorphicChore
  public polymorphicChoreId: DreamColumn<ChoreCleaningSupply, 'polymorphicChoreId'>

  @deco.BelongsTo('Polymorphic/CleaningSupply')
  public cleaningSupply: CleaningSupply
  public polymorphicCleaningSupplyId: DreamColumn<ChoreCleaningSupply, 'polymorphicCleaningSupplyId'>
}
