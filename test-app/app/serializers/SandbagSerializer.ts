import { DateTime } from 'luxon'
import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'

export default class SandbagSerializer extends DreamSerializer {
  @Attribute()
  public weight: number

  @Attribute('date-time')
  public updatedAt: DateTime

  @Attribute({
    type: 'object',
    properties: {
      label: 'string',
      value: {
        type: 'object',
        properties: {
          unit: 'string',
          value: 'number',
        },
      },
    },
  })
  public answer() {}
}
