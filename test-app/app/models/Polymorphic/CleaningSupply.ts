import { DreamColumn } from '../../../../src/types/dream.js'
import { CleaningSupplySerializer } from '../../serializers/Polymorphic/CleaningSupplySerializer.js'
import ApplicationModel from '../ApplicationModel.js'

// const deco = new Decorators<typeof CleaningSupply>()

export default class CleaningSupply extends ApplicationModel {
  public override get table() {
    return 'polymorphic_cleaning_supplies' as const
  }

  public get serializers() {
    return {
      default: CleaningSupplySerializer,
    }
  }

  public id: DreamColumn<CleaningSupply, 'id'>
  public name: DreamColumn<CleaningSupply, 'name'>
  public createdAt: DreamColumn<CleaningSupply, 'createdAt'>
  public updatedAt: DreamColumn<CleaningSupply, 'updatedAt'>
}
