import { Decorators } from '../../../../src/index.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import { WorkoutSerializer } from '../../serializers/Polymorphic/WorkoutSerializer.js'
import ApplicationModel from '../ApplicationModel.js'
import PolymorphicLocalizedText from './LocalizedText.js'

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

  @deco.HasMany('Polymorphic/LocalizedText', {
    polymorphic: true,
    foreignKey: 'localizableId',
  })
  public localizedTexts: PolymorphicLocalizedText[]
}
