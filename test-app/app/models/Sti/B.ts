import STI from '../../../../src/decorators/class/STI.js'
import Decorators from '../../../../src/decorators/Decorators.js'
import { DreamColumn, DreamSerializers } from '../../../../src/types/dream.js'
import Chore from '../Polymorphic/Chore.js'
import TaskableImage from '../Polymorphic/TaskableImage.js'
import Workout from '../Polymorphic/Workout.js'
import StiBase from './Base.js'

const deco = new Decorators<typeof StiB>()

@STI(StiBase)
export default class StiB extends StiBase {
  public override get serializers(): DreamSerializers<StiB> {
    return {
      default: 'Sti/BSerializer',
      summary: 'Sti/BSummarySerializer',
    }
  }

  @deco.BelongsTo(['Polymorphic/Chore', 'Polymorphic/Workout'], {
    polymorphic: true,
    on: 'taskableId',
  })
  public taskable: Chore | Workout
  public taskableType: DreamColumn<TaskableImage, 'taskableType'>
  public taskableId: DreamColumn<TaskableImage, 'taskableId'>
}
