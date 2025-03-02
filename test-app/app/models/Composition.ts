import { Decorators } from '../../../src'
import { DreamColumn, DreamConst, DreamSerializers, Type } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import CompositionAsset from './CompositionAsset'
import CompositionAssetAudit from './CompositionAssetAudit'
import HeartRating from './ExtraRating/HeartRating'
import LocalizedText from './LocalizedText'
import User from './User'

const Decorator = new Decorators<Type<typeof Composition>>()

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

  @Decorator.BelongsTo('User')
  public user: User
  public userId: DreamColumn<Composition, 'userId'>

  @Decorator.HasMany('CompositionAsset')
  public compositionAssets: CompositionAsset[]

  @Decorator.HasOne('CompositionAsset', {
    on: { primary: true },
  })
  public mainCompositionAsset: CompositionAsset

  @Decorator.HasMany('CompositionAssetAudit', {
    through: 'compositionAssets',
  })
  public compositionAssetAudits: CompositionAssetAudit[]

  @Decorator.HasMany('CompositionAssetAudit', {
    through: 'mainCompositionAsset',
    source: 'compositionAssetAudits',
  })
  public mainCompositionAssetAudits: CompositionAssetAudit[]

  @Decorator.HasMany('ExtraRating/HeartRating', {
    foreignKey: 'extraRateableId',
    polymorphic: true,
  })
  public heartRatings: HeartRating[]

  @Decorator.BeforeCreate()
  public setDefaultContent() {
    if (!this.content) this.content = 'default content'
  }

  @Decorator.AfterCreate()
  public conditionallyChangeContentOnCreate() {
    if (this.content === 'change me after create') this.content = 'changed after create'
    if (this.content === 'change me after create commit')
      this.content = 'changed after create, but should change after create commit'
  }

  @Decorator.AfterUpdate()
  public conditionallyChangeContentOnUpdate() {
    if (this.content === 'change me after update') this.content = 'changed after update'
    if (this.content === 'change me after update commit')
      this.content = 'changed after update, but should change after update commit'
  }

  @Decorator.AfterSave()
  public conditionallyChangeContentOnSave() {
    if (this.content === 'change me after save') this.content = 'changed after save'
    if (this.content === 'change me after save commit')
      this.content = 'changed after save, but should change after save commit'
  }

  @Decorator.AfterCreateCommit()
  public conditionallyChangeContentOnCreateCommit() {
    if (this.content === 'changed after create, but should change after create commit')
      this.content = 'changed after create commit'
  }

  @Decorator.AfterUpdateCommit()
  public conditionallyChangeContentOnUpdateCommit() {
    if (this.content === 'changed after update, but should change after update commit')
      this.content = 'changed after update commit'
  }
  @Decorator.AfterSaveCommit()
  public conditionallyChangeContentOnSaveCommit() {
    if (this.content === 'changed after save, but should change after save commit')
      this.content = 'changed after save commit'
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

  @Decorator.HasOne('LocalizedText', {
    polymorphic: true,
    foreignKey: 'localizableId',
    on: { name: 'cascade delete me' },
    dependent: 'destroy',
  })
  public cascadeDeletableLocalizedText: LocalizedText

  @Decorator.HasMany('LocalizedText', { polymorphic: true, foreignKey: 'localizableId' })
  public localizedTexts: LocalizedText[]
}

export interface CompositionMetadata {
  version?: number
  contributors?: string[]
}
