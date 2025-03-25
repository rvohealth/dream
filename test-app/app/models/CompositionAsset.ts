import { DreamConst } from '../../../src/dream/constants.js'
import { Decorators } from '../../../src/index.js'
import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import Composition from './Composition.js'
import CompositionAssetAudit from './CompositionAssetAudit.js'
import LocalizedText from './LocalizedText.js'
import User from './User.js'

const deco = new Decorators<InstanceType<typeof CompositionAsset>>()

export default class CompositionAsset extends ApplicationModel {
  public get table() {
    return 'composition_assets' as const
  }

  public id: DreamColumn<CompositionAsset, 'id'>
  public src: DreamColumn<CompositionAsset, 'src'>
  public name: DreamColumn<CompositionAsset, 'name'>
  public primary: DreamColumn<CompositionAsset, 'primary'>
  public score: DreamColumn<CompositionAsset, 'score'>

  @deco.BelongsTo('Composition')
  public composition: Composition
  public compositionId: DreamColumn<CompositionAsset, 'compositionId'>

  @deco.HasOne('User', {
    through: 'composition',
  })
  public user: User

  @deco.HasMany('CompositionAssetAudit')
  public compositionAssetAudits: CompositionAssetAudit[]

  @deco.BeforeSave()
  public ensureDefaultSrc() {
    this.src ||= 'default src'
  }

  private compositionToUpdateDuringDestroy: Composition | undefined

  @deco.BeforeDestroy()
  public async updateCompositionContentBeforeDestroy(this: CompositionAsset) {
    const reloaded = this.loaded('composition') ? this : await this.load('composition').execute()
    this.compositionToUpdateDuringDestroy = reloaded.composition
    if (this.src === 'mark before destroy')
      await reloaded.composition.update({ content: 'something was destroyed' })
  }

  @deco.AfterDestroy()
  public async updateCompositionContentAfterDestroy(this: CompositionAsset) {
    if (this.src === 'mark after destroy')
      await this.compositionToUpdateDuringDestroy?.update({
        content: 'changed after destroying composition asset',
      })
  }

  @deco.AfterDestroyCommit()
  public async updateCompositionContentAfterDestroyCommit(this: CompositionAsset) {
    if (this.src === 'mark after destroy commit')
      await this.compositionToUpdateDuringDestroy?.update({
        content: 'changed after destroy commit of composition asset',
      })
  }

  @deco.HasOne('LocalizedText', {
    polymorphic: true,
    foreignKey: 'localizableId',
    on: { locale: DreamConst.required },
  })
  public requiredCurrentLocalizedText: LocalizedText

  @deco.HasOne('LocalizedText', {
    polymorphic: true,
    foreignKey: 'localizableId',
    on: { locale: DreamConst.passthrough },
  })
  public passthroughCurrentLocalizedText: LocalizedText

  @deco.HasMany('LocalizedText', { polymorphic: true, foreignKey: 'localizableId' })
  public localizedTexts: LocalizedText[]
}
