import { DreamConst } from '../../../src/dream/constants.js'
import { Decorators } from '../../../src/index.js'
import { DreamColumn, DreamSerializers } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import CompositionAsset from './CompositionAsset.js'
import CompositionAssetAudit from './CompositionAssetAudit.js'
import HeartRating from './ExtraRating/HeartRating.js'
import LocalizedText from './LocalizedText.js'
import User from './User.js'

const deco = new Decorators<InstanceType<typeof Composition>>()

export default class Composition extends ApplicationModel {
  public get table() {
    return 'compositions' as const
  }

  public get serializers(): DreamSerializers<Composition> {
    return { default: 'CompositionSerializer' }
  }

  public id: DreamColumn<Composition, 'id'>
  public content: DreamColumn<Composition, 'content'>
  public metadata: DreamColumn<Composition, 'metadata'>
  public createdAt: DreamColumn<Composition, 'createdAt'>
  public updatedAt: DreamColumn<Composition, 'updatedAt'>

  @deco.BelongsTo('User')
  public user: User
  public userId: DreamColumn<Composition, 'userId'>

  @deco.HasMany('CompositionAsset')
  public compositionAssets: CompositionAsset[]

  @deco.HasOne('CompositionAsset', {
    on: { primary: true },
  })
  public mainCompositionAsset: CompositionAsset

  @deco.HasMany('CompositionAssetAudit', {
    through: 'compositionAssets',
  })
  public compositionAssetAudits: CompositionAssetAudit[]

  @deco.HasMany('CompositionAssetAudit', {
    through: 'mainCompositionAsset',
    source: 'compositionAssetAudits',
  })
  public mainCompositionAssetAudits: CompositionAssetAudit[]

  @deco.HasMany('ExtraRating/HeartRating', {
    foreignKey: 'extraRateableId',
    polymorphic: true,
  })
  public heartRatings: HeartRating[]

  @deco.BeforeCreate()
  public setDefaultContent() {
    if (!this.content) this.content = 'default content'
  }

  @deco.AfterCreate()
  public conditionallyChangeContentOnCreate() {
    if (this.content === 'change me after create') this.content = 'changed after create'
    if (this.content === 'change me after create commit')
      this.content = 'changed after create, but should change after create commit'
  }

  @deco.AfterUpdate()
  public conditionallyChangeContentOnUpdate() {
    if (this.content === 'change me after update') this.content = 'changed after update'
    if (this.content === 'change me after update commit')
      this.content = 'changed after update, but should change after update commit'
  }

  @deco.AfterSave()
  public conditionallyChangeContentOnSave() {
    if (this.content === 'change me after save') this.content = 'changed after save'
    if (this.content === 'change me after save commit')
      this.content = 'changed after save, but should change after save commit'
  }

  @deco.AfterCreateCommit()
  public conditionallyChangeContentOnCreateCommit() {
    if (this.content === 'changed after create, but should change after create commit')
      this.content = 'changed after create commit'
  }

  @deco.AfterUpdateCommit()
  public conditionallyChangeContentOnUpdateCommit() {
    if (this.content === 'changed after update, but should change after update commit')
      this.content = 'changed after update commit'
  }
  @deco.AfterSaveCommit()
  public conditionallyChangeContentOnSaveCommit() {
    if (this.content === 'changed after save, but should change after save commit')
      this.content = 'changed after save commit'
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

  @deco.HasOne('LocalizedText', {
    polymorphic: true,
    foreignKey: 'localizableId',
    on: { name: 'cascade delete me' },
    dependent: 'destroy',
  })
  public cascadeDeletableLocalizedText: LocalizedText

  @deco.HasMany('LocalizedText', { polymorphic: true, foreignKey: 'localizableId' })
  public localizedTexts: LocalizedText[]
}

export interface CompositionMetadata {
  version?: number
  contributors?: string[]
}
