import { Decorators } from '../../../src/index.js'
import { DreamColumn, DreamSerializers } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import Composition from './Composition.js'
import CompositionAsset from './CompositionAsset.js'

const deco = new Decorators<InstanceType<typeof LocalizedText>>()

export default class LocalizedText extends ApplicationModel {
  public get table() {
    return 'localized_texts' as const
  }

  public get serializers(): DreamSerializers<LocalizedText> {
    return { default: 'LocalizedText/BaseSerializer' }
  }

  public id: DreamColumn<LocalizedText, 'id'>
  public locale: DreamColumn<LocalizedText, 'locale'>
  public localizableType: DreamColumn<LocalizedText, 'localizableType'>
  public localizableId: DreamColumn<LocalizedText, 'localizableId'>
  public name: DreamColumn<LocalizedText, 'name'>
  public title: DreamColumn<LocalizedText, 'title'>
  public body: DreamColumn<LocalizedText, 'body'>
  public createdAt: DreamColumn<LocalizedText, 'createdAt'>
  public updatedAt: DreamColumn<LocalizedText, 'updatedAt'>

  @deco.BelongsTo(['Composition', 'CompositionAsset'], {
    foreignKey: 'localizableId',
    polymorphic: true,
  })
  public localizable: Composition | CompositionAsset
}
