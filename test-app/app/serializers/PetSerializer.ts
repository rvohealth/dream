import { IdType } from '../../../src/dream/types'
import DreamSerializer from '../../../src/serializer'
import RendersMany from '../../../src/serializer/decorators/associations/renders-many'
import Attribute from '../../../src/serializer/decorators/attribute'
import Pet from '../models/Pet'
import Rating from '../models/Rating'

export default class PetSerializer<DataType extends Pet, Passthrough extends object> extends DreamSerializer<
  DataType,
  Passthrough
> {
  @Attribute(Pet, 'id')
  public id: IdType

  @Attribute(Pet, 'name')
  public name: string

  @Attribute(Pet, 'favoriteDaysOfWeek', { description: 'The days the Pet is happiest' })
  public favoriteDaysOfWeek: number[]

  @Attribute(Pet, 'species')
  public species: string

  @RendersMany(Rating)
  public ratings: Rating[]
}

export class PetSummarySerializer<DataType extends Pet, Passthrough extends object> extends DreamSerializer<
  DataType,
  Passthrough
> {
  @Attribute('string')
  public id: IdType

  @Attribute('string')
  public favoriteTreats: string
}
