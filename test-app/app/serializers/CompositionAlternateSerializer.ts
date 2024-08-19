import { RendersMany, RendersOne } from '../../../src'
import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'
import { CompositionMetadata } from '../models/Composition'
import CompositionAsset from '../models/CompositionAsset'
import LocalizedText from '../models/LocalizedText'
import { LocalizedTextBaseSerializer } from './LocalizedText/BaseSerializer'

// Since this serializer's name is different from the model it is related to,
// dream will not be able to infer the origin model, and will fail to lookup serializers
// that aren't explicitly specified or else given a lookup path.
export default class CompositionAlternateSerializer extends DreamSerializer {
  @Attribute()
  public id: string

  @Attribute('json')
  public metadata: CompositionMetadata

  @RendersMany()
  public compositionAssets: CompositionAsset[]

  @RendersMany(() => LocalizedTextBaseSerializer<any>)
  public localizedTexts: LocalizedText[]

  // intentionally omitting the serializer callback to
  // explicitly test importing from only a path config
  @RendersOne({ path: 'LocalizedText/BaseSerializer', exportedAs: 'LocalizedTextBaseSerializer' })
  public currentLocalizedText: LocalizedText
}
