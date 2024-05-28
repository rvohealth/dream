import BelongsTo from '../../../src/decorators/associations/belongs-to'
import HasMany from '../../../src/decorators/associations/has-many'
import HasOne from '../../../src/decorators/associations/has-one'
import AfterDestroy from '../../../src/decorators/hooks/after-destroy'
import AfterDestroyCommit from '../../../src/decorators/hooks/after-destroy-commit'
import BeforeDestroy from '../../../src/decorators/hooks/before-destroy'
import BeforeSave from '../../../src/decorators/hooks/before-save'
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

  @BelongsTo(() => Composition)
  public composition: Composition
  public compositionId: DreamColumn<CompositionAsset, 'compositionId'>

  @HasOne(() => User, {
    through: 'composition',
  })
  public user: User

  @HasMany(() => CompositionAssetAudit)
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

  @HasOne(() => LocalizedText, {
    polymorphic: true,
    foreignKey: 'localizableId',
    where: { locale: DreamConst.requiredWhereClause },
  })
  public inlineWhereCurrentLocalizedText: LocalizedText

  @HasOne(() => LocalizedText, {
    polymorphic: true,
    foreignKey: 'localizableId',
    where: { locale: DreamConst.passthrough },
  })
  public currentLocalizedText: LocalizedText

  @HasMany(() => LocalizedText, { polymorphic: true, foreignKey: 'localizableId' })
  public localizedTexts: LocalizedText[]
}
