import { Decorators } from '../../../src/index.js'
import { DreamColumn, DreamSerializers } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import Mylar from './Balloon/Mylar.js'

const deco = new Decorators<InstanceType<typeof Sandbag>>()

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

  @deco.Validate()
  public validateWeight(this: Sandbag) {
    if (!this.weight) return

    const undefinedOrNull: any[] = [undefined, null]
    if (!undefinedOrNull.includes(this.weightKgs))
      this.addError('weight', 'cannot include weightKgs AND weight')
    if (!undefinedOrNull.includes(this.weightTons))
      this.addError('weight', 'cannot include weightTons AND weight')
  }

  @deco.BelongsTo('Balloon/Mylar', { foreignKey: 'balloonId' })
  public mylar: Mylar
  public balloonId: DreamColumn<Sandbag, 'balloonId'>

  @deco.BeforeCreate({ ifChanging: ['weightKgs'] })
  public conditionalBeforeCreateHook() {}

  @deco.BeforeSave({ ifChanging: ['weight'] })
  public conditionalBeforeSaveHook() {}

  @deco.BeforeUpdate({ ifChanging: ['weightTons'] })
  public conditionalBeforeUpdateHook() {}

  @deco.AfterCreate({ ifChanged: ['weightKgs'] })
  public conditionalAfterCreateHook() {}

  @deco.AfterSave({ ifChanged: ['weight'] })
  public conditionalAfterSaveHook() {}

  @deco.AfterUpdate({ ifChanged: ['weightTons'] })
  public conditionalAfterUpdateHook() {}

  @deco.AfterCreateCommit({ ifChanged: ['weightKgs'] })
  public conditionalAfterCreateCommitHook() {}

  @deco.AfterSaveCommit({ ifChanged: ['weight'] })
  public conditionalAfterSaveCommitHook() {}

  @deco.AfterUpdateCommit({ ifChanged: ['weightTons'] })
  public conditionalAfterUpdateCommitHook() {}
}
