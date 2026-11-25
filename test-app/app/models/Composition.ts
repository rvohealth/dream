import Decorators from '../../../src/decorators/Decorators.js'
import { DreamConst } from '../../../src/dream/constants.js'
import { DreamColumn, DreamSerializers } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import CompositionAsset from './CompositionAsset.js'
import CompositionAssetAudit from './CompositionAssetAudit.js'
import HeartRating from './ExtraRating/HeartRating.js'
import LocalizedText from './LocalizedText.js'
import User from './User.js'

const deco = new Decorators<typeof Composition>()

export default class Composition extends ApplicationModel {
  public override get table() {
    return 'compositions' as const
  }

  public get serializers(): DreamSerializers<Composition> {
    return { default: 'CompositionSerializer' }
  }

  public id: DreamColumn<Composition, 'id'>
  public content: DreamColumn<Composition, 'content'>

  @deco.JSON({
    type: 'object',
    properties: {
      version: 'integer',
      contributors: 'string[]',
    },
  })
  public metadata: DreamColumn<Composition, 'metadata'>

  // a json column left without @deco.JSON, so a serializer must declare its shape
  public metadata2: DreamColumn<Composition, 'metadata2'>

  // a nullable jsonb column whose declared shape is an array of closed
  // objects, with date and date-time strings
  @deco.JSON({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['draft', 'published'] },
        publishedOn: 'date',
        reviewedOn: { type: 'date' },
        reviewedAt: 'date-time',
      },
      required: ['status'],
      additionalProperties: false,
    },
  })
  public metadata3: DreamColumn<Composition, 'metadata3'>

  public createdAt: DreamColumn<Composition, 'createdAt'>
  public updatedAt: DreamColumn<Composition, 'updatedAt'>

  @deco.BelongsTo('User')
  public user: User
  public userId: DreamColumn<Composition, 'userId'>

  @deco.HasMany('CompositionAsset')
  public compositionAssets: CompositionAsset[]

  @deco.HasOne('CompositionAsset', {
    and: { primary: true },
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
    on: 'extraRateableId',
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
    on: 'localizableId',
    and: { locale: DreamConst.required },
  })
  public requiredCurrentLocalizedText: LocalizedText

  @deco.HasOne('LocalizedText', {
    polymorphic: true,
    on: 'localizableId',
    and: { locale: DreamConst.passthrough },
  })
  public passthroughCurrentLocalizedText: LocalizedText

  @deco.HasOne('LocalizedText', {
    polymorphic: true,
    on: 'localizableId',
    and: { locale: DreamConst.required, name: DreamConst.passthrough },
  })
  public passthroughAndRequiredCurrentLocalizedText: LocalizedText

  @deco.HasOne('LocalizedText', {
    polymorphic: true,
    on: 'localizableId',
    and: { name: 'cascade delete me' },
    dependent: 'destroy',
  })
  public cascadeDeletableLocalizedText: LocalizedText

  @deco.HasMany('LocalizedText', { polymorphic: true, on: 'localizableId' })
  public localizedTexts: LocalizedText[]
}

export interface CompositionMetadata {
  version?: number
  contributors?: string[]
}
