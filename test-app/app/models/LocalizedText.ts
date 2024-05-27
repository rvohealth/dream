import ApplicationModel from './ApplicationModel'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import { DreamColumn } from '../../../src/dream/types'
import Composition from './Composition'
import CompositionAsset from './CompositionAsset'
import { LocalizedTextBaseSerializer } from '../serializers/LocalizedText/BaseSerializer'

export default class LocalizedText extends ApplicationModel {
  public get table() {
    return 'localized_texts' as const
  }

  public get serializers() {
    return { default: LocalizedTextBaseSerializer<any> } as const
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
