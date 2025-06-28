import { Decorators } from '../../../../src/index.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import ApplicationModel from '../ApplicationModel.js'
import A from './A.js'

const deco = new Decorators<typeof B>()

export default class B extends ApplicationModel {
  public override get table() {
    return 'through_bs' as const
  }

  public id: DreamColumn<B, 'id'>
  public name: DreamColumn<B, 'name'>
  public createdAt: DreamColumn<B, 'createdAt'>
  public updatedAt: DreamColumn<B, 'updatedAt'>

  @deco.BelongsTo('Through/A', { foreignKey: 'aId' })
  public a: A
  public aId: DreamColumn<B, 'aId'>
}
