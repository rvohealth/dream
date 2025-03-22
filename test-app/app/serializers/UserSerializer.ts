import { CalendarDate } from '../../../src/index.js'
import RendersOne from '../../../src/serializer/decorators/associations/RendersOne.js'
import Attribute from '../../../src/serializer/decorators/attribute.js'
import DreamSerializer from '../../../src/serializer/index.js'
import { IdType } from '../../../src/types/dream.js'
import User from '../models/User.js'
import UserSettings from '../models/UserSettings.js'

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
