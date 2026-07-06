import Decorators from '../../../../src/decorators/Decorators.js'
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

  @deco.HasMany('Through/A', { through: 'otherModel', source: 'a', and: { name: 'Beautiful A' } })
  public myAndA: A[]

  @deco.HasMany('Through/B', { through: 'myAndA', source: 'b' })
  public myAndB: B[]

  @deco.HasMany('Through/A', {
    through: 'otherModel',
    source: 'a',
    andAny: [{ name: 'Beautiful A' }, { name: 'Gorgeous A' }],
  })
  public myAndAnyA: A[]

  @deco.HasMany('Through/B', { through: 'myAndAnyA', source: 'b' })
  public myAndAnyB: B[]

  @deco.HasMany('Through/A', { through: 'otherModel', source: 'a', andNot: { name: 'Forgettable A' } })
  public myAndNotA: A[]

  @deco.HasMany('Through/B', { through: 'myAndNotA', source: 'b' })
  public myAndNotB: B[]

  @deco.HasMany('Through/A', { through: 'otherModel', source: 'a', selfAnd: { name: 'name' } })
  public mySelfAndA: A[]

  @deco.HasMany('Through/B', { through: 'mySelfAndA', source: 'b' })
  public mySelfAndB: B[]

  @deco.HasMany('Through/A', { through: 'otherModel', source: 'a', selfAndNot: { name: 'name' } })
  public mySelfAndNotA: A[]

  @deco.HasMany('Through/B', { through: 'mySelfAndNotA', source: 'b' })
  public mySelfAndNotB: B[]

  @deco.HasMany('Through/A', { through: 'otherModel', source: 'a', order: 'name' })
  public myOrderedA: A[]

  @deco.HasMany('Through/B', { through: 'myOrderedA', source: 'b' })
  public myOrderedB: B[]

  @deco.HasMany('Through/B', { through: 'myOrderedA', source: 'b', order: { name: 'desc' } })
  public myStackOrderedB: B[]

  @deco.HasMany('Through/A', { through: 'otherModel', source: 'a', distinct: true })
  public myDistinctA: A[]

  @deco.HasMany('Through/B', { through: 'myDistinctA', source: 'b' })
  public myDistinctB: B[]
}
