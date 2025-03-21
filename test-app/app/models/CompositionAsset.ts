import { DreamColumn, DreamConst } from '../../../src/dream/types.js'
import { Decorators } from '../../../src/index.js'
import ApplicationModel from './ApplicationModel.js'
import Composition from './Composition.js'
import CompositionAssetAudit from './CompositionAssetAudit.js'
import LocalizedText from './LocalizedText.js'
import User from './User.js'

const Deco = new Decorators<InstanceType<typeof CompositionAsset>>()

export default class CompositionAsset extends ApplicationModel {
  public get table() {
    return 'composition_assets' as const
  }

  public id: DreamColumn<CompositionAsset, 'id'>
  public src: DreamColumn<CompositionAsset, 'src'>
  public name: DreamColumn<CompositionAsset, 'name'>
  public primary: DreamColumn<CompositionAsset, 'primary'>
  public score: DreamColumn<CompositionAsset, 'score'>

  @Deco.BelongsTo('Composition')
  public composition: Composition
  public compositionId: DreamColumn<CompositionAsset, 'compositionId'>

  @Deco.HasOne('User', {
    through: 'composition',
  })
  public user: User

  @Deco.HasMany('CompositionAssetAudit')
  public compositionAssetAudits: CompositionAssetAudit[]

  @Deco.BeforeSave()
  public ensureDefaultSrc() {
    this.src ||= 'default src'
  }

  private compositionToUpdateDuringDestroy: Composition | undefined

  @Deco.BeforeDestroy()
  public async updateCompositionContentBeforeDestroy(this: CompositionAsset) {
    const reloaded = this.loaded('composition') ? this : await this.load('composition').execute()
    this.compositionToUpdateDuringDestroy = reloaded.composition
    if (this.src === 'mark before destroy')
      await reloaded.composition.update({ content: 'something was destroyed' })
  }

  @Deco.AfterDestroy()
  public async updateCompositionContentAfterDestroy(this: CompositionAsset) {
    if (this.src === 'mark after destroy')
      await this.compositionToUpdateDuringDestroy?.update({
        content: 'changed after destroying composition asset',
      })
  }

  @Deco.AfterDestroyCommit()
  public async updateCompositionContentAfterDestroyCommit(this: CompositionAsset) {
    if (this.src === 'mark after destroy commit')
      await this.compositionToUpdateDuringDestroy?.update({
        content: 'changed after destroy commit of composition asset',
      })
  }

  @Deco.HasOne('LocalizedText', {
    polymorphic: true,
    foreignKey: 'localizableId',
    on: { locale: DreamConst.required },
  })
  public requiredCurrentLocalizedText: LocalizedText

  @Deco.HasOne('LocalizedText', {
    polymorphic: true,
    foreignKey: 'localizableId',
    on: { locale: DreamConst.passthrough },
  })
  public passthroughCurrentLocalizedText: LocalizedText

  @Deco.HasMany('LocalizedText', { polymorphic: true, foreignKey: 'localizableId' })
  public localizedTexts: LocalizedText[]
}
