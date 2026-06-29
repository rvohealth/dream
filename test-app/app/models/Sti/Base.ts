import Decorators from '../../../../src/decorators/Decorators.js'
import { DreamColumn, DreamSerializers } from '../../../../src/types/dream.js'
import ApplicationModel from '../ApplicationModel.js'
import Pet from '../Pet.js'
import Chore from '../Polymorphic/Chore.js'
import TaskableImage from '../Polymorphic/TaskableImage.js'
import Workout from '../Polymorphic/Workout.js'

const deco = new Decorators<typeof StiBase>()

export default class StiBase extends ApplicationModel {
  public override get table() {
    return 'sti_bases' as const
  }

  public get serializers(): DreamSerializers<StiBase> {
    return {
      default: 'Sti/BaseSerializer',
      summary: 'Sti/BaseSummarySerializer',
    }
  }

  public id: DreamColumn<StiBase, 'id'>
  public type: DreamColumn<StiBase, 'type'>
  public name: DreamColumn<StiBase, 'name'>
  public createdAt: DreamColumn<StiBase, 'createdAt'>
  public updatedAt: DreamColumn<StiBase, 'updatedAt'>

  @deco.BelongsTo('Pet', { on: 'petId' })
  public pet: Pet
  public petId: DreamColumn<StiBase, 'petId'>

  @deco.BelongsTo(['Polymorphic/Chore', 'Polymorphic/Workout'], {
    polymorphic: true,
    on: 'taskableId',
  })
  public taskable: Chore | Workout
  public taskableType: DreamColumn<TaskableImage, 'taskableType'>
  public taskableId: DreamColumn<TaskableImage, 'taskableId'>
}
