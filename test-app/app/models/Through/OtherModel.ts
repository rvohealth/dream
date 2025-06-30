import { Decorators } from '../../../../src/index.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import ApplicationModel from '../ApplicationModel.js'
import A from './A.js'
import AToOtherModelJoinModel from './AToOtherModelJoinModel.js'
import MyModel from './MyModel.js'

const deco = new Decorators<typeof OtherModel>()

export default class OtherModel extends ApplicationModel {
  public override get table() {
    return 'through_other_models' as const
  }

  public id: DreamColumn<OtherModel, 'id'>
  public name: DreamColumn<OtherModel, 'name'>
  public createdAt: DreamColumn<OtherModel, 'createdAt'>
  public updatedAt: DreamColumn<OtherModel, 'updatedAt'>

  @deco.BelongsTo('Through/MyModel', { foreignKey: 'myModelId' })
  public myModel: MyModel
  public myModelId: DreamColumn<OtherModel, 'myModelId'>

  @deco.HasOne('Through/AToOtherModelJoinModel', { foreignKey: 'otherModelId' })
  public aToOtherModelJoinModel: AToOtherModelJoinModel

  @deco.HasOne('Through/A', { through: 'aToOtherModelJoinModel', source: 'a' })
  public a: A
}
