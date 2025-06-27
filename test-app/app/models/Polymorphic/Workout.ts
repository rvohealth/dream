import { DreamColumn } from '../../../../src/types/dream.js'
import ApplicationModel from '../ApplicationModel.js'

// const deco = new Decorators<typeof Workout>()

export default class Workout extends ApplicationModel {
  public override get table() {
    return 'polymorphic_workouts' as const
  }

  public id: DreamColumn<Workout, 'id'>
  public name: DreamColumn<Workout, 'name'>
  public createdAt: DreamColumn<Workout, 'createdAt'>
  public updatedAt: DreamColumn<Workout, 'updatedAt'>
}
