import { DreamModelSerializer } from '../../../src/serializer/index.js'
import Sandbag from '../models/Sandbag.js'

const SandbagSerializer = ($data: Sandbag) =>
  DreamModelSerializer(Sandbag, $data)
    .attribute('weight')
    .attribute('updatedAt')
    .attributeFunction('answer', () => null, {
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

    .attributeFunction('dateOrDatetime', () => null, {
      anyOf: [
        {
          type: ['date-time', 'null'],
        },
        {
          type: ['date', 'null'],
        },
      ],
    })

    .attributeFunction('refTest', () => null, {
      anyOf: [
        {
          type: ['date', 'null'],
        },
        {
          $ref: 'components/schemas/Howyadoin',
        },
      ],
    })

    .attributeFunction('enumTest', () => null, {
      type: 'string',
      enum: ['hello', 'world'],
    })

    .attribute('history' as any, { type: 'object', additionalProperties: 'number' })

    .attribute('nullableHistory' as any, {
      type: 'object',
      additionalProperties: { type: ['number', 'null'] },
    })

    .attribute('howyadoin' as any, {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: { code: { type: 'integer' }, text: { type: 'string' } },
      },
    })

export default SandbagSerializer
