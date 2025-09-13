import { Decorators } from '../../../../src/index.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import ApplicationModel from '../ApplicationModel.js'
import Chore from './Chore.js'
import Workout from './Workout.js'

const deco = new Decorators<typeof PolymorphicLocalizedText>()

export default class PolymorphicLocalizedText extends ApplicationModel {
  public override get table() {
    return 'polymorphic_localized_texts' as const
  }

  public id: DreamColumn<PolymorphicLocalizedText, 'id'>
  public locale: DreamColumn<PolymorphicLocalizedText, 'locale'>
  public title: DreamColumn<PolymorphicLocalizedText, 'title'>
  public createdAt: DreamColumn<PolymorphicLocalizedText, 'createdAt'>
  public updatedAt: DreamColumn<PolymorphicLocalizedText, 'updatedAt'>

  @deco.BelongsTo(['Polymorphic/Chore', 'Polymorphic/Workout'], {
    polymorphic: true,
    on: 'localizableId',
  })
  public localizable: Chore | Workout
  public localizableId: DreamColumn<PolymorphicLocalizedText, 'localizableId'>
  public localizableType: DreamColumn<PolymorphicLocalizedText, 'localizableType'>
}
