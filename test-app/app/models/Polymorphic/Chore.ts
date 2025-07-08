import { Decorators } from '../../../../src/index.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import { ChoreSerializer } from '../../serializers/Polymorphic/ChoreSerializer.js'
import ApplicationModel from '../ApplicationModel.js'
import ChoreCleaningSupply from './ChoreCleaningSupply.js'
import CleaningSupply from './CleaningSupply.js'
import Image from './Image.js'
import PolymorphicLocalizedText from './LocalizedText.js'
import TaskableImage from './TaskableImage.js'

const deco = new Decorators<typeof Chore>()

export default class Chore extends ApplicationModel {
  public override get table() {
    return 'polymorphic_chores' as const
  }

  public get serializers() {
    return {
      default: ChoreSerializer,
    }
  }

  public id: DreamColumn<Chore, 'id'>
  public name: DreamColumn<Chore, 'name'>
  public createdAt: DreamColumn<Chore, 'createdAt'>
  public updatedAt: DreamColumn<Chore, 'updatedAt'>

  @deco.HasMany('Polymorphic/LocalizedText', {
    polymorphic: true,
    foreignKey: 'localizableId',
  })
  public localizedTexts: PolymorphicLocalizedText[]

  @deco.HasMany('Polymorphic/ChoreCleaningSupply')
  public choreCleaningSupplies: ChoreCleaningSupply[]

  @deco.HasMany('Polymorphic/CleaningSupply', { through: 'choreCleaningSupplies' })
  public cleaningSupplies: CleaningSupply[]

  @deco.HasMany('Polymorphic/TaskableImage', {
    polymorphic: true,
    foreignKey: 'taskableId',
  })
  public taskableImages: TaskableImage[]

  @deco.HasMany('Polymorphic/Image', { through: 'taskableImages', source: 'image' })
  public imagesThroughTaskableImages: Image[]

  @deco.HasMany('Polymorphic/ChoreImage')
  public choreImages: TaskableImage[]

  @deco.HasMany('Polymorphic/Image', { through: 'choreImages' })
  public images: Image[]
}
