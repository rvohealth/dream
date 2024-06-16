import BelongsTo from '../../../src/decorators/associations/belongs-to'
import HasMany from '../../../src/decorators/associations/has-many'
import HasOne from '../../../src/decorators/associations/has-one'
import AfterCreate from '../../../src/decorators/hooks/after-create'
import AfterCreateCommit from '../../../src/decorators/hooks/after-create-commit'
import AfterSave from '../../../src/decorators/hooks/after-save'
import AfterSaveCommit from '../../../src/decorators/hooks/after-save-commit'
import AfterUpdate from '../../../src/decorators/hooks/after-update'
import AfterUpdateCommit from '../../../src/decorators/hooks/after-update-commit'
import BeforeCreate from '../../../src/decorators/hooks/before-create'
import { DreamColumn, DreamConst } from '../../../src/dream/types'
import CompositionSerializer from '../serializers/CompositionSerializer'
import ApplicationModel from './ApplicationModel'
import CompositionAsset from './CompositionAsset'
import CompositionAssetAudit from './CompositionAssetAudit'
import HeartRating from './ExtraRating/HeartRating'
import LocalizedText from './LocalizedText'
import User from './User'

export default class Composition extends ApplicationModel {
  public get table() {
    return 'compositions' as const
  }

  public get serializers() {
    return { default: CompositionSerializer } as const
  }

  public id: DreamColumn<Composition, 'id'>
  public content: DreamColumn<Composition, 'content'>
  public metadata: DreamColumn<Composition, 'metadata'>
  public createdAt: DreamColumn<Composition, 'createdAt'>
  public updatedAt: DreamColumn<Composition, 'updatedAt'>

  @BelongsTo(() => User)
  public user: User
  public userId: DreamColumn<Composition, 'userId'>

  @HasMany(() => CompositionAsset)
  public compositionAssets: CompositionAsset[]

  @HasOne(() => CompositionAsset, {
    where: { primary: true },
  })
  public mainCompositionAsset: CompositionAsset

  @HasMany(() => CompositionAssetAudit, {
    through: 'compositionAssets',
  })
  public compositionAssetAudits: CompositionAssetAudit[]

  @HasMany(() => CompositionAssetAudit, {
    through: 'mainCompositionAsset',
    source: 'compositionAssetAudits',
  })
  public mainCompositionAssetAudits: CompositionAssetAudit[]

  @HasMany(() => HeartRating, {
    foreignKey: 'extraRateableId',
    polymorphic: true,
  })
  public heartRatings: HeartRating[]

  @BeforeCreate()
  public setDefaultContent() {
    if (!this.content) this.content = 'default content'
  }

  @AfterCreate()
  public conditionallyChangeContentOnCreate() {
    if (this.content === 'change me after create') this.content = 'changed after create'
    if (this.content === 'change me after create commit')
      this.content = 'changed after create, but should change after create commit'
  }

  @AfterUpdate()
  public conditionallyChangeContentOnUpdate() {
    if (this.content === 'change me after update') this.content = 'changed after update'
    if (this.content === 'change me after update commit')
      this.content = 'changed after update, but should change after update commit'
  }

  @AfterSave()
  public conditionallyChangeContentOnSave() {
    if (this.content === 'change me after save') this.content = 'changed after save'
    if (this.content === 'change me after save commit')
      this.content = 'changed after save, but should change after save commit'
  }

  @AfterCreateCommit()
  public conditionallyChangeContentOnCreateCommit() {
    if (this.content === 'changed after create, but should change after create commit')
      this.content = 'changed after create commit'
  }

  @AfterUpdateCommit()
  public conditionallyChangeContentOnUpdateCommit() {
    if (this.content === 'changed after update, but should change after update commit')
      this.content = 'changed after update commit'
  }
  @AfterSaveCommit()
  public conditionallyChangeContentOnSaveCommit() {
    if (this.content === 'changed after save, but should change after save commit')
      this.content = 'changed after save commit'
  }

  @HasOne(() => LocalizedText, {
    polymorphic: true,
    foreignKey: 'localizableId',
    where: { locale: DreamConst.required },
  })
  public inlineWhereCurrentLocalizedText: LocalizedText

  @HasOne(() => LocalizedText, {
    polymorphic: true,
    foreignKey: 'localizableId',
    where: { locale: DreamConst.passthrough },
  })
  public currentLocalizedText: LocalizedText

  @HasOne(() => LocalizedText, {
    polymorphic: true,
    foreignKey: 'localizableId',
    where: { name: 'cascade delete me' },
    dependent: 'destroy',
  })
  public cascadeDeletableLocalizedText: LocalizedText

  @HasMany(() => LocalizedText, { polymorphic: true, foreignKey: 'localizableId' })
  public localizedTexts: LocalizedText[]
}

export interface CompositionMetadata {
  version?: number
  contributors?: string[]
}
