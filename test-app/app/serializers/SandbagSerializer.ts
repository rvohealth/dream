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
        type: 'date-time',
        nullable: true,
      },
      {
        type: 'date',
        nullable: false,
      },
    ],
  })
  public dateOrDatetime() {}

  @Attribute({
    anyOf: [
      {
        type: 'date',
        nullable: false,
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

  @Attribute({ type: 'object', additionalProperties: { type: 'number', nullable: true } })
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
