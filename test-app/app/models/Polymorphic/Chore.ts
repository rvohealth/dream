import { Decorators } from '../../../../src/index.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import ApplicationModel from '../ApplicationModel.js'

const deco = new Decorators<typeof Chore>()

export default class Chore extends ApplicationModel {
  public override get table() {
    return 'polymorphic_chores' as const
  }

  public id: DreamColumn<Chore, 'id'>
  public name: DreamColumn<Chore, 'name'>
  public createdAt: DreamColumn<Chore, 'createdAt'>
  public updatedAt: DreamColumn<Chore, 'updatedAt'>
}
