import RendersMany from '../../../src/serializer/decorators/associations/RendersMany.js'
import Attribute from '../../../src/serializer/decorators/attribute.js'
import DreamSerializer from '../../../src/serializer/index.js'
import { DreamColumn, IdType } from '../../../src/types/dream.js'
import Pet from '../models/Pet.js'
import Rating from '../models/Rating.js'

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
  @Attribute(Pet)
  public id: IdType

  @Attribute(Pet)
  public favoriteTreats: string
}
