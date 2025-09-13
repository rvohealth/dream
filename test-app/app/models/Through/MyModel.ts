import { Decorators } from '../../../../src/index.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import ApplicationModel from '../ApplicationModel.js'
import A from './A.js'
import B from './B.js'
import OtherModel from './OtherModel.js'

const deco = new Decorators<typeof MyModel>()

export default class MyModel extends ApplicationModel {
  public override get table() {
    return 'through_my_models' as const
  }

  public id: DreamColumn<MyModel, 'id'>
  public name: DreamColumn<MyModel, 'name'>
  public createdAt: DreamColumn<MyModel, 'createdAt'>
  public updatedAt: DreamColumn<MyModel, 'updatedAt'>

  @deco.HasMany('Through/OtherModel', { on: 'myModelId' })
  public otherModel: OtherModel

  @deco.HasMany('Through/A', { through: 'otherModel', source: 'a' })
  public myA: A

  @deco.HasOne('Through/A', { through: 'otherModel', source: 'a', and: { name: 'Beautiful A' } })
  public myConditionalA: A

  @deco.HasMany('Through/B', { through: 'myA', source: 'b' })
  public myB: B

  @deco.HasMany('Through/B', { through: 'myConditionalA', source: 'b' })
  public myConditionalB: B
}
