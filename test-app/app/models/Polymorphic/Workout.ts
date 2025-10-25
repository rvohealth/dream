import Decorators from '../../../../src/decorators/Decorators.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import { WorkoutSerializer } from '../../serializers/Polymorphic/WorkoutSerializer.js'
import ApplicationModel from '../ApplicationModel.js'
import Image from './Image.js'
import PolymorphicLocalizedText from './LocalizedText.js'
import TaskableImage from './TaskableImage.js'
import WorkoutType from './WorkoutType.js'

const deco = new Decorators<typeof Workout>()

export default class Workout extends ApplicationModel {
  public override get table() {
    return 'polymorphic_workouts' as const
  }

  public get serializers() {
    return {
      default: WorkoutSerializer,
    }
  }

  public id: DreamColumn<Workout, 'id'>
  public name: DreamColumn<Workout, 'name'>
  public createdAt: DreamColumn<Workout, 'createdAt'>
  public updatedAt: DreamColumn<Workout, 'updatedAt'>

  @deco.BelongsTo('Polymorphic/WorkoutType', { optional: true })
  public workoutType: WorkoutType
  public polymorphicWorkoutTypeId: DreamColumn<Workout, 'polymorphicWorkoutTypeId'>

  @deco.HasMany('Polymorphic/LocalizedText', {
    polymorphic: true,
    on: 'localizableId',
  })
  public localizedTexts: PolymorphicLocalizedText[]

  @deco.HasMany('Polymorphic/TaskableImage', {
    polymorphic: true,
    on: 'taskableId',
  })
  public taskableImages: TaskableImage[]

  @deco.HasMany('Polymorphic/Image', { through: 'taskableImages', source: 'image' })
  public imagesThroughTaskableImages: Image[]

  @deco.HasMany('Polymorphic/WorkoutImage')
  public workoutImages: TaskableImage[]

  @deco.HasMany('Polymorphic/Image', { through: 'workoutImages' })
  public images: Image[]
}
