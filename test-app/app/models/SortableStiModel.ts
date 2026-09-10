import Decorators from '../../../src/decorators/Decorators.js'
import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'

const deco = new Decorators<typeof SortableStiModel>()

export default class SortableStiModel extends ApplicationModel {
  public override get table() {
    return 'sortable_sti_models' as const
  }

  public id: DreamColumn<SortableStiModel, 'id'>
  public type: DreamColumn<SortableStiModel, 'type'>
  public createdAt: DreamColumn<SortableStiModel, 'createdAt'>
  public updatedAt: DreamColumn<SortableStiModel, 'updatedAt'>

  @deco.Sortable()
  public positionIndependent: DreamColumn<SortableStiModel, 'positionIndependent'>

  @deco.Sortable({ scope: 'type' })
  public positionByType: DreamColumn<SortableStiModel, 'positionByType'>
}
