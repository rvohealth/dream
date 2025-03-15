import { RendersMany, RendersOne } from '../../../src.js'
import Attribute from '../../../src/serializer/decorators/attribute.js'
import DreamSerializer from '../../../src/serializer/index.js'
import { CompositionMetadata } from '../models/Composition.js'
import CompositionAsset from '../models/CompositionAsset.js'
import LocalizedText from '../models/LocalizedText.js'
import { LocalizedTextBaseSerializer } from './LocalizedText/BaseSerializer.js'

export default class CompositionSerializer extends DreamSerializer {
  @Attribute()
  public id: string

  @Attribute('json')
  public metadata: CompositionMetadata

  @RendersMany()
  public compositionAssets: CompositionAsset[]

  @RendersMany(() => LocalizedTextBaseSerializer<any>)
  public localizedTexts: LocalizedText[]

  @RendersOne()
  public passthroughCurrentLocalizedText: LocalizedText
}
