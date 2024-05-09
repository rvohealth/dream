import { IdType } from '../../../src/dream/types'
import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'
import User from '../models/User'
import { CalendarDate } from '../../../src'

export default class UserSerializer<
  DataType extends User,
  Passthrough extends object,
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute('string')
  public id: IdType

  @Attribute('string')
  public name: string

  @Attribute('date')
  public birthdate: CalendarDate
}

export class UserIndexSerializer<DataType extends User, Passthrough extends object> extends DreamSerializer<
  DataType,
  Passthrough
> {
  @Attribute('string')
  public id: IdType

  @Attribute('string')
  public favoriteWord: string
}
