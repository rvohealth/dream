import { Decorators } from '../../../src'
import { DreamColumn, DreamSerializers } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import Composition from './Composition'
import CompositionAsset from './CompositionAsset'

const Deco = new Decorators<InstanceType<typeof LocalizedText>>()

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

  @Deco.BelongsTo(['Composition', 'CompositionAsset'], {
    foreignKey: 'localizableId',
    polymorphic: true,
  })
  public localizable: Composition | CompositionAsset
}
