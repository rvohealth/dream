import { Decorators } from '../../../src'
import { DreamColumn, DreamConst, Type } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import Composition from './Composition'
import CompositionAssetAudit from './CompositionAssetAudit'
import LocalizedText from './LocalizedText'
import User from './User'

const Decorator = new Decorators<Type<typeof CompositionAsset>>()

export default class CompositionAsset extends ApplicationModel {
  public get table() {
    return 'composition_assets' as const
  }

  public id: DreamColumn<CompositionAsset, 'id'>
  public src: DreamColumn<CompositionAsset, 'src'>
  public name: DreamColumn<CompositionAsset, 'name'>
  public primary: DreamColumn<CompositionAsset, 'primary'>
  public score: DreamColumn<CompositionAsset, 'score'>

  @Decorator.BelongsTo('Composition')
  public composition: Composition
  public compositionId: DreamColumn<CompositionAsset, 'compositionId'>

  @Decorator.HasOne('User', {
    through: 'composition',
  })
  public user: User

  @Decorator.HasMany('CompositionAssetAudit')
  public compositionAssetAudits: CompositionAssetAudit[]

  @Decorator.BeforeSave()
  public ensureDefaultSrc() {
    this.src ||= 'default src'
  }

  private compositionToUpdateDuringDestroy: Composition | undefined

  @Decorator.BeforeDestroy()
  public async updateCompositionContentBeforeDestroy(this: CompositionAsset) {
    const reloaded = this.loaded('composition') ? this : await this.load('composition').execute()
    this.compositionToUpdateDuringDestroy = reloaded.composition
    if (this.src === 'mark before destroy')
      await reloaded.composition.update({ content: 'something was destroyed' })
  }

  @Decorator.AfterDestroy()
  public async updateCompositionContentAfterDestroy(this: CompositionAsset) {
    if (this.src === 'mark after destroy')
      await this.compositionToUpdateDuringDestroy?.update({
        content: 'changed after destroying composition asset',
      })
  }

  @Decorator.AfterDestroyCommit()
  public async updateCompositionContentAfterDestroyCommit(this: CompositionAsset) {
    if (this.src === 'mark after destroy commit')
      await this.compositionToUpdateDuringDestroy?.update({
        content: 'changed after destroy commit of composition asset',
      })
  }

  @Decorator.HasOne('LocalizedText', {
    polymorphic: true,
    foreignKey: 'localizableId',
    on: { locale: DreamConst.required },
  })
  public requiredCurrentLocalizedText: LocalizedText

  @Decorator.HasOne('LocalizedText', {
    polymorphic: true,
    foreignKey: 'localizableId',
    on: { locale: DreamConst.passthrough },
  })
  public passthroughCurrentLocalizedText: LocalizedText

  @Decorator.HasMany('LocalizedText', { polymorphic: true, foreignKey: 'localizableId' })
  public localizedTexts: LocalizedText[]
}
