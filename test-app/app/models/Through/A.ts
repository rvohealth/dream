import { Decorators } from '../../../../src/index.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import ApplicationModel from '../ApplicationModel.js'
import B from './B.js'

const deco = new Decorators<typeof A>()

export default class A extends ApplicationModel {
  public override get table() {
    return 'through_as' as const
  }

  public id: DreamColumn<A, 'id'>
  public name: DreamColumn<A, 'name'>
  public createdAt: DreamColumn<A, 'createdAt'>
  public updatedAt: DreamColumn<A, 'updatedAt'>

  @deco.HasOne('Through/B', { foreignKey: 'aId' })
  public b: B
}
