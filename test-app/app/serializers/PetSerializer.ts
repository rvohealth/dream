import { IdType } from '../../../src'
import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'

export default class PetSerializer extends DreamSerializer {
  @Attribute()
  public id: IdType

  @Attribute()
  public name: string

  @Attribute()
  public species: string
}
