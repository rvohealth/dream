import { RendersMany, RendersOne } from '../../../src'
import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'
import { CompositionMetadata } from '../models/Composition'
import CompositionAsset from '../models/CompositionAsset'
import LocalizedText from '../models/LocalizedText'
import { LocalizedTextBaseSerializer } from './LocalizedText/BaseSerializer'

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
  public currentLocalizedText: LocalizedText
}
