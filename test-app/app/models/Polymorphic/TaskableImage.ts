import { Decorators } from '../../../../src/index.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import ApplicationModel from '../ApplicationModel.js'
import Chore from './Chore.js'
import PolymorphicImage from './Image.js'
import Workout from './Workout.js'

const deco = new Decorators<typeof TaskableImage>()

export default class TaskableImage extends ApplicationModel {
  public override get table() {
    return 'polymorphic_taskable_images' as const
  }

  public id: DreamColumn<TaskableImage, 'id'>
  public createdAt: DreamColumn<TaskableImage, 'createdAt'>
  public updatedAt: DreamColumn<TaskableImage, 'updatedAt'>

  @deco.BelongsTo(['Polymorphic/Chore', 'Polymorphic/Workout'], {
    polymorphic: true,
    foreignKey: 'taskableId',
  })
  public taskable: Chore | Workout
  public taskableType: DreamColumn<TaskableImage, 'taskableType'>
  public taskableId: DreamColumn<TaskableImage, 'taskableId'>

  @deco.BelongsTo('Polymorphic/Image')
  public image: PolymorphicImage
  public polymorphicImageId: DreamColumn<TaskableImage, 'polymorphicImageId'>
}
