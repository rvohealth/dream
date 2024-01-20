import { IdType } from '../../../src'
import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'
import RendersMany from '../../../src/serializer/decorators/associations/renders-many'
import Rating from '../models/Rating'

export default class PetSerializer extends DreamSerializer {
  @Attribute('string')
  public id: IdType

  @Attribute('string')
  public name: string

  @Attribute('enum:Species')
  public species: string

  @RendersMany()
  public ratings: Rating[]
}
