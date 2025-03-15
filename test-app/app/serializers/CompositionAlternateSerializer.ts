import { RendersMany, RendersOne } from '../../../src.js'
import Attribute from '../../../src/serializer/decorators/attribute.js'
import DreamSerializer from '../../../src/serializer/index.js'
import { CompositionMetadata } from '../models/Composition.js'
import CompositionAsset from '../models/CompositionAsset.js'
import LocalizedText from '../models/LocalizedText.js'
import { LocalizedTextBaseSerializer } from './LocalizedText/BaseSerializer.js'

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
  public passthroughCurrentLocalizedText: LocalizedText
}
