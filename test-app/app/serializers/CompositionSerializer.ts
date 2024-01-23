import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'
import { CompositionMetadata } from '../models/Composition'

export default class CompositionSerializer extends DreamSerializer {
  @Attribute()
  public id: string

  @Attribute('json')
  public metadata: CompositionMetadata
}
