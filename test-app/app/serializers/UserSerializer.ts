import { IdType } from '../../../src/dream/types'
import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'
import RendersOne from '../../../src/serializer/decorators/associations/renders-one'
import User from '../models/User'
import { CalendarDate } from '../../../src'
import UserSettings from '../models/UserSettings'

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

  @RendersOne({ optional: true })
  public userSettings: UserSettings
}

export class UserSummarySerializer<DataType extends User, Passthrough extends object> extends DreamSerializer<
  DataType,
  Passthrough
> {
  @Attribute('string')
  public id: IdType

  @Attribute('string')
  public favoriteWord: string
}
