import { IdType } from '../../../src/dream/types'
import DreamSerializer from '../../../src/serializer'
import RendersMany from '../../../src/serializer/decorators/associations/renders-many'
import Attribute from '../../../src/serializer/decorators/attribute'
import { SpeciesValues } from '../../db/sync'
import Pet from '../models/Pet'
import Rating from '../models/Rating'

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

  @Attribute({
    type: 'string',
    enum: SpeciesValues,
  })
  public species: string

  @RendersMany()
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
