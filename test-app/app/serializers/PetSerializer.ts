import { IdType } from '../../../src/dream/types'
import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'
import RendersMany from '../../../src/serializer/decorators/associations/renders-many'
import Rating from '../models/Rating'
import Pet from '../models/Pet'

export default class PetSerializer<DataType extends Pet, Passthrough extends object> extends DreamSerializer<
  DataType,
  Passthrough
> {
  @Attribute('string')
  public id: IdType

  @Attribute('string')
  public name: string

  @Attribute('number[]')
  public favoriteDaysOfWeek: number[]

  @Attribute('enum:Species')
  public species: string

  @RendersMany()
  public ratings: Rating[]
}
