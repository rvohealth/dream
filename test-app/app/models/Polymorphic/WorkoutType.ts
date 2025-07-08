import { DreamColumn } from '../../../../src/types/dream.js'
import { WorkouttypeSerializer } from '../../serializers/Polymorphic/WorkoutTypeSerializer.js'
import ApplicationModel from '../ApplicationModel.js'

// const deco = new Decorators<typeof WorkoutType>()

export default class WorkoutType extends ApplicationModel {
  public override get table() {
    return 'polymorphic_workout_types' as const
  }

  public get serializers() {
    return {
      default: WorkouttypeSerializer,
    }
  }

  public id: DreamColumn<WorkoutType, 'id'>
  public workoutType: DreamColumn<WorkoutType, 'workoutType'>
  public createdAt: DreamColumn<WorkoutType, 'createdAt'>
  public updatedAt: DreamColumn<WorkoutType, 'updatedAt'>
}
