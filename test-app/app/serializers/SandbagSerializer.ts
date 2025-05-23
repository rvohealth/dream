import { DateTime } from '../../../src/index.js'
import Attribute from '../../../src/serializer/decorators/attribute.js'
import DreamSerializer from '../../../src/serializer/index.js'

export default class SandbagSerializer extends DreamSerializer {
  @Attribute()
  public weight: number

  @Attribute('date-time')
  public updatedAt: DateTime

  @Attribute({
    type: 'object',
    properties: {
      label: {
        type: 'string',
      },
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

  @Attribute({
    anyOf: [
      {
        type: ['date-time', 'null'],
      },
      {
        type: ['date', 'null'],
      },
    ],
  })
  public dateOrDatetime() {}

  @Attribute({
    anyOf: [
      {
        type: ['date', 'null'],
      },
      {
        $ref: 'components/schemas/Howyadoin',
      },
    ],
  })
  public refTest() {}

  @Attribute({
    type: 'string',
    enum: ['hello', 'world'],
  })
  public enumTest() {}

  @Attribute({ type: 'object', additionalProperties: 'number' })
  public history: Record<string, number>

  @Attribute({ type: 'object', additionalProperties: { type: ['number', 'null'] } })
  public nullableHistory: Record<string, number>

  @Attribute({
    type: 'object',
    additionalProperties: {
      type: 'object',
      properties: { code: { type: 'integer' }, text: { type: 'string' } },
    },
  })
  public howyadoin: Record<string, { code: string; text: string }>
}
