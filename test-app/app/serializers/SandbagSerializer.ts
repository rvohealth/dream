import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import Sandbag from '../models/Sandbag.js'

export default (data: Sandbag) =>
  DreamSerializer(Sandbag, data)
    .attribute('weight')
    .attribute('updatedAt')
    .customAttribute('answer', () => null, {
      openapi: {
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
      },
    })

    .customAttribute('dateOrDatetime', () => null, {
      openapi: {
        anyOf: [
          {
            type: ['date-time', 'null'],
          },
          {
            type: ['date', 'null'],
          },
        ],
      },
    })

    .customAttribute('refTest', () => null, {
      openapi: {
        anyOf: [
          {
            type: ['date', 'null'],
          },
          {
            $ref: 'components/schemas/Howyadoin',
          },
        ],
      },
    })

    .customAttribute('enumTest', () => null, {
      openapi: {
        type: 'string',
        enum: ['hello', 'world'],
      },
    })

    .attribute('history' as any, { openapi: { type: 'object', additionalProperties: 'number' } })

    .attribute('nullableHistory' as any, {
      openapi: {
        type: 'object',
        additionalProperties: { type: ['number', 'null'] },
      },
    })

    .attribute('howyadoin' as any, {
      openapi: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: { code: { type: 'integer' }, text: { type: 'string' } },
        },
      },
    })
