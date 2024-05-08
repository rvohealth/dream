import ApplicationModel from './ApplicationModel'
import { DateTime } from 'luxon'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import { IdType } from '../../../src/dream/types'
import Composition from './Composition'
import CompositionAsset from './CompositionAsset'
import { LocalesEnum, LocalizableTypesEnum } from '../../db/sync'
import { LocalizedTextBaseSerializer } from '../serializers/LocalizedText/BaseSerializer'

export default class LocalizedText extends ApplicationModel {
  public get table() {
    return 'localized_texts' as const
  }

  public get serializers() {
    return { default: LocalizedTextBaseSerializer<any> } as const
  }

  public id: IdType
  public locale: LocalesEnum
  public localizableType: LocalizableTypesEnum
  public localizableId: string
  public createdAt: DateTime
  public updatedAt: DateTime

  @BelongsTo(() => [Composition, CompositionAsset], {
    foreignKey: 'localizableId',
    polymorphic: true,
  })
  public localizable: Composition | CompositionAsset
}
