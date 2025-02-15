import AfterDestroy from '../../../src/decorators/hooks/AfterDestroy'
import AfterDestroyCommit from '../../../src/decorators/hooks/AfterDestroyCommit'
import BeforeDestroy from '../../../src/decorators/hooks/BeforeDestroy'
import BeforeSave from '../../../src/decorators/hooks/BeforeSave'
import { DreamColumn, DreamConst } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import Composition from './Composition'
import CompositionAssetAudit from './CompositionAssetAudit'
import LocalizedText from './LocalizedText'
import User from './User'

export default class CompositionAsset extends ApplicationModel {
  public get table() {
    return 'composition_assets' as const
  }

  public id: DreamColumn<CompositionAsset, 'id'>
  public src: DreamColumn<CompositionAsset, 'src'>
  public name: DreamColumn<CompositionAsset, 'name'>
  public primary: DreamColumn<CompositionAsset, 'primary'>
  public score: DreamColumn<CompositionAsset, 'score'>

  @CompositionAsset.BelongsTo('Composition')
  public composition: Composition
  public compositionId: DreamColumn<CompositionAsset, 'compositionId'>

  @CompositionAsset.HasOne('User', {
    through: 'composition',
  })
  public user: User

  @CompositionAsset.HasMany('CompositionAssetAudit')
  public compositionAssetAudits: CompositionAssetAudit[]

  @BeforeSave()
  public ensureDefaultSrc() {
    this.src ||= 'default src'
  }

  private compositionToUpdateDuringDestroy: Composition | undefined

  @BeforeDestroy()
  public async updateCompositionContentBeforeDestroy(this: CompositionAsset) {
    const reloaded = this.loaded('composition') ? this : await this.load('composition').execute()
    this.compositionToUpdateDuringDestroy = reloaded.composition
    if (this.src === 'mark before destroy')
      await reloaded.composition.update({ content: 'something was destroyed' })
  }

  @AfterDestroy()
  public async updateCompositionContentAfterDestroy(this: CompositionAsset) {
    if (this.src === 'mark after destroy')
      await this.compositionToUpdateDuringDestroy?.update({
        content: 'changed after destroying composition asset',
      })
  }

  @AfterDestroyCommit()
  public async updateCompositionContentAfterDestroyCommit(this: CompositionAsset) {
    if (this.src === 'mark after destroy commit')
      await this.compositionToUpdateDuringDestroy?.update({
        content: 'changed after destroy commit of composition asset',
      })
  }

  @CompositionAsset.HasOne('LocalizedText', {
    polymorphic: true,
    foreignKey: 'localizableId',
    on: { locale: DreamConst.required },
  })
  public requiredCurrentLocalizedText: LocalizedText

  @CompositionAsset.HasOne('LocalizedText', {
    polymorphic: true,
    foreignKey: 'localizableId',
    on: { locale: DreamConst.passthrough },
  })
  public passthroughCurrentLocalizedText: LocalizedText

  @CompositionAsset.HasMany('LocalizedText', { polymorphic: true, foreignKey: 'localizableId' })
  public localizedTexts: LocalizedText[]
}
