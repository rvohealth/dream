import { Decorators } from '../../../../src/index.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import ApplicationModel from '../ApplicationModel.js'
import PolymorphicImage from './Image.js'
import PolymorphicWorkout from './Workout.js'

const deco = new Decorators<typeof WorkoutImage>()

export default class WorkoutImage extends ApplicationModel {
  public override get table() {
    return 'polymorphic_workout_images' as const
  }

  public id: DreamColumn<WorkoutImage, 'id'>
  public createdAt: DreamColumn<WorkoutImage, 'createdAt'>
  public updatedAt: DreamColumn<WorkoutImage, 'updatedAt'>

  @deco.BelongsTo('Polymorphic/Workout')
  public workout: PolymorphicWorkout
  public polymorphicWorkoutId: DreamColumn<WorkoutImage, 'polymorphicWorkoutId'>

  @deco.BelongsTo('Polymorphic/Image')
  public image: PolymorphicImage
  public polymorphicImageId: DreamColumn<WorkoutImage, 'polymorphicImageId'>
}
