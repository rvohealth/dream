import { Decorators } from '../../../../src/index.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import ApplicationModel from '../ApplicationModel.js'
import Chore from './Chore.js'
import PolymorphicUser from './User.js'
import Workout from './Workout.js'

const deco = new Decorators<typeof PolymorphicTask>()

export default class PolymorphicTask extends ApplicationModel {
  public override get table() {
    return 'polymorphic_tasks' as const
  }

  public id: DreamColumn<PolymorphicTask, 'id'>
  public createdAt: DreamColumn<PolymorphicTask, 'createdAt'>
  public updatedAt: DreamColumn<PolymorphicTask, 'updatedAt'>

  @deco.BelongsTo('Polymorphic/User', { foreignKey: 'polymorphicUserId' })
  public user: PolymorphicUser
  public polymorphicUserId: DreamColumn<PolymorphicTask, 'polymorphicUserId'>

  @deco.BelongsTo(['Polymorphic/Chore', 'Polymorphic/Workout'], {
    polymorphic: true,
    foreignKey: 'taskableId',
  })
  public taskable: Chore | Workout
  public taskableId: DreamColumn<PolymorphicTask, 'taskableId'>
  public taskableType: DreamColumn<PolymorphicTask, 'taskableType'>
}
