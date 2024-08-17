import { DreamColumn, IdType } from '../../../src/dream/types'
import DreamSerializer from '../../../src/serializer'
import RendersMany from '../../../src/serializer/decorators/associations/renders-many'
import Attribute from '../../../src/serializer/decorators/attribute'
import Pet from '../models/Pet'
import Rating from '../models/Rating'

export default class PetSerializer<DataType extends Pet, Passthrough extends object> extends DreamSerializer<
  DataType,
  Passthrough
> {
  @Attribute(Pet)
  public id: DreamColumn<Pet, 'id'>

  @Attribute(Pet)
  public name: DreamColumn<Pet, 'name'>

  @Attribute(Pet, { description: 'The days the Pet is happiest' })
  public favoriteDaysOfWeek: DreamColumn<Pet, 'favoriteDaysOfWeek'>

  @Attribute(Pet)
  public species: DreamColumn<Pet, 'species'>

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
