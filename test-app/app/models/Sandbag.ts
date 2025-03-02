import { Decorators } from '../../../src'
import Validate from '../../../src/decorators/validations/Validate'
import { DreamColumn, DreamSerializers, Type } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import Mylar from './Balloon/Mylar'

const Decorator = new Decorators<Type<typeof Sandbag>>()

export default class Sandbag extends ApplicationModel {
  public get table() {
    return 'sandbags' as const
  }

  public get serializers(): DreamSerializers<Sandbag> {
    return { default: 'SandbagSerializer' }
  }

  public id: DreamColumn<Sandbag, 'id'>
  public weight: DreamColumn<Sandbag, 'weight'>
  public weightKgs: DreamColumn<Sandbag, 'weightKgs'>
  public weightTons: DreamColumn<Sandbag, 'weightTons'>
  public createdAt: DreamColumn<Sandbag, 'createdAt'>
  public updatedAt: DreamColumn<Sandbag, 'updatedAt'>

  @Validate()
  public validateWeight(this: Sandbag) {
    if (!this.weight) return

    const undefinedOrNull: any[] = [undefined, null]
    if (!undefinedOrNull.includes(this.weightKgs))
      this.addError('weight', 'cannot include weightKgs AND weight')
    if (!undefinedOrNull.includes(this.weightTons))
      this.addError('weight', 'cannot include weightTons AND weight')
  }

  @Decorator.BelongsTo('Balloon/Mylar', { foreignKey: 'balloonId' })
  public mylar: Mylar
  public balloonId: DreamColumn<Sandbag, 'balloonId'>

  @Decorator.BeforeCreate({ ifChanging: ['weightKgs'] })
  public conditionalBeforeCreateHook() {}

  @Decorator.BeforeSave({ ifChanging: ['weight'] })
  public conditionalBeforeSaveHook() {}

  @Decorator.BeforeUpdate({ ifChanging: ['weightTons'] })
  public conditionalBeforeUpdateHook() {}

  @Decorator.AfterCreate({ ifChanged: ['weightKgs'] })
  public conditionalAfterCreateHook() {}

  @Decorator.AfterSave({ ifChanged: ['weight'] })
  public conditionalAfterSaveHook() {}

  @Decorator.AfterUpdate({ ifChanged: ['weightTons'] })
  public conditionalAfterUpdateHook() {}

  @Decorator.AfterCreateCommit({ ifChanged: ['weightKgs'] })
  public conditionalAfterCreateCommitHook() {}

  @Decorator.AfterSaveCommit({ ifChanged: ['weight'] })
  public conditionalAfterSaveCommitHook() {}

  @Decorator.AfterUpdateCommit({ ifChanged: ['weightTons'] })
  public conditionalAfterUpdateCommitHook() {}
}
