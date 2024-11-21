import Validate from '../../../src/decorators/validations/Validate'
import { DreamColumn, DreamSerializers } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import Mylar from './Balloon/Mylar'

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

  @Sandbag.BelongsTo('Balloon/Mylar', { foreignKey: 'balloonId' })
  public mylar: Mylar
  public balloonId: DreamColumn<Sandbag, 'balloonId'>

  @Sandbag.BeforeCreate({ ifChanging: ['weightKgs'] })
  public conditionalBeforeCreateHook() {}

  @Sandbag.BeforeSave({ ifChanging: ['weight'] })
  public conditionalBeforeSaveHook() {}

  @Sandbag.BeforeUpdate({ ifChanging: ['weightTons'] })
  public conditionalBeforeUpdateHook() {}

  @Sandbag.AfterCreate({ ifChanged: ['weightKgs'] })
  public conditionalAfterCreateHook() {}

  @Sandbag.AfterSave({ ifChanged: ['weight'] })
  public conditionalAfterSaveHook() {}

  @Sandbag.AfterUpdate({ ifChanged: ['weightTons'] })
  public conditionalAfterUpdateHook() {}

  @Sandbag.AfterCreateCommit({ ifChanged: ['weightKgs'] })
  public conditionalAfterCreateCommitHook() {}

  @Sandbag.AfterSaveCommit({ ifChanged: ['weight'] })
  public conditionalAfterSaveCommitHook() {}

  @Sandbag.AfterUpdateCommit({ ifChanged: ['weightTons'] })
  public conditionalAfterUpdateCommitHook() {}
}
