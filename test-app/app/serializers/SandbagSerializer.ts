import { DateTime } from 'luxon'
import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'

export default class SandbagSerializer extends DreamSerializer {
  @Attribute()
  public weight: number

  @Attribute('datetime')
  public updatedAt: DateTime
}
