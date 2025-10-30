import Decorators from '../../../../src/decorators/Decorators.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import ApplicationModel from '../ApplicationModel.js'
import PolymorphicChore from './Chore.js'
import PolymorphicImage from './Image.js'

const deco = new Decorators<typeof ChoreImage>()

export default class ChoreImage extends ApplicationModel {
  public override get table() {
    return 'polymorphic_chore_images' as const
  }

  public id: DreamColumn<ChoreImage, 'id'>
  public createdAt: DreamColumn<ChoreImage, 'createdAt'>
  public updatedAt: DreamColumn<ChoreImage, 'updatedAt'>

  @deco.BelongsTo('Polymorphic/Chore')
  public chore: PolymorphicChore
  public polymorphicChoreId: DreamColumn<ChoreImage, 'polymorphicChoreId'>

  @deco.BelongsTo('Polymorphic/Image')
  public image: PolymorphicImage
  public polymorphicImageId: DreamColumn<ChoreImage, 'polymorphicImageId'>
}
