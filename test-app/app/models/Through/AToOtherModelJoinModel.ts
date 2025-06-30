import { Decorators } from '../../../../src/index.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import ApplicationModel from '../ApplicationModel.js'
import A from './A.js'
import OtherModel from './OtherModel.js'

const deco = new Decorators<typeof AToOtherModelJoinModel>()

export default class AToOtherModelJoinModel extends ApplicationModel {
  public override get table() {
    return 'through_a_to_other_model_join_models' as const
  }

  public id: DreamColumn<AToOtherModelJoinModel, 'id'>
  @deco.Sortable({ scope: 'otherModel' })
  public position: DreamColumn<AToOtherModelJoinModel, 'position'>
  public createdAt: DreamColumn<AToOtherModelJoinModel, 'createdAt'>
  public updatedAt: DreamColumn<AToOtherModelJoinModel, 'updatedAt'>

  @deco.BelongsTo('Through/OtherModel', { foreignKey: 'otherModelId' })
  public otherModel: OtherModel
  public otherModelId: DreamColumn<AToOtherModelJoinModel, 'otherModelId'>

  @deco.BelongsTo('Through/A', { foreignKey: 'aId' })
  public a: A
  public aId: DreamColumn<AToOtherModelJoinModel, 'aId'>
}
