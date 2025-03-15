import Validate from '../../../src/decorators/validations/Validate.js'
import { DreamColumn, DreamSerializers } from '../../../src/dream/types.js'
import { Decorators } from '../../../src/index.js'
import ApplicationModel from './ApplicationModel.js'
import Mylar from './Balloon/Mylar.js'

const Deco = new Decorators<InstanceType<typeof Sandbag>>()

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

  @Deco.BelongsTo('Balloon/Mylar', { foreignKey: 'balloonId' })
  public mylar: Mylar
  public balloonId: DreamColumn<Sandbag, 'balloonId'>

  @Deco.BeforeCreate({ ifChanging: ['weightKgs'] })
  public conditionalBeforeCreateHook() {}

  @Deco.BeforeSave({ ifChanging: ['weight'] })
  public conditionalBeforeSaveHook() {}

  @Deco.BeforeUpdate({ ifChanging: ['weightTons'] })
  public conditionalBeforeUpdateHook() {}

  @Deco.AfterCreate({ ifChanged: ['weightKgs'] })
  public conditionalAfterCreateHook() {}

  @Deco.AfterSave({ ifChanged: ['weight'] })
  public conditionalAfterSaveHook() {}

  @Deco.AfterUpdate({ ifChanged: ['weightTons'] })
  public conditionalAfterUpdateHook() {}

  @Deco.AfterCreateCommit({ ifChanged: ['weightKgs'] })
  public conditionalAfterCreateCommitHook() {}

  @Deco.AfterSaveCommit({ ifChanged: ['weight'] })
  public conditionalAfterSaveCommitHook() {}

  @Deco.AfterUpdateCommit({ ifChanged: ['weightTons'] })
  public conditionalAfterUpdateCommitHook() {}
}
