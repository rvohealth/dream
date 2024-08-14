import BelongsTo from '../../../src/decorators/associations/belongs-to'
import { DreamColumn, DreamSerializers } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import Composition from './Composition'
import CompositionAsset from './CompositionAsset'

export default class LocalizedText extends ApplicationModel {
  public get table() {
    return 'localized_texts' as const
  }

  public get serializers(): DreamSerializers<LocalizedText> {
    return { default: 'LocalizedTextBaseSerializer' }
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

  @BelongsTo(() => [Composition, CompositionAsset], {
    foreignKey: 'localizableId',
    polymorphic: true,
  })
  public localizable: Composition | CompositionAsset
}
