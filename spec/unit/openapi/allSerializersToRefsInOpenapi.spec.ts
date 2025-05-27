import { OpenapiSchemaBodyShorthand } from '../../../src/index.js'
import allSerializersToRefsInOpenapi from '../../../src/openapi/allSerializersToRefsInOpenapi.js'
import AnimalSerializer from '../../../test-app/app/serializers/Balloon/Latex/AnimalSerializer.js'
import LatexSerializer from '../../../test-app/app/serializers/Balloon/LatexSerializer.js'
import MylarSerializer from '../../../test-app/app/serializers/Balloon/MylarSerializer.js'
import PetSerializer from '../../../test-app/app/serializers/PetSerializer.js'

describe('allSerializersToRefsInOpenapi', () => {
  it('converts $serializer to $ref', () => {
    const openapi: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: {
        myProperty: {
          $serializer: PetSerializer,
        },
        myProperties: {
          type: 'array',
          items: {
            $serializer: LatexSerializer,
          },
        },
        myNullableProperty: {
          anyOf: [
            {
              $serializer: AnimalSerializer,
            },
            { type: 'null' },
          ],
        },
        myNullableProperties: {
          type: ['array', 'null'],
          items: {
            $serializer: MylarSerializer,
          },
        },
      },
    }

    const results = allSerializersToRefsInOpenapi(openapi, '')

    expect(results).toEqual({
      type: 'object',
      properties: {
        myProperty: {
          $ref: '#/components/schemas/Pet',
        },
        myProperties: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/BalloonLatex',
          },
        },
        myNullableProperty: {
          anyOf: [
            {
              $ref: '#/components/schemas/BalloonLatexAnimal',
            },
            { type: 'null' },
          ],
        },
        myNullableProperties: {
          type: ['array', 'null'],
          items: {
            $ref: '#/components/schemas/BalloonMylar',
          },
        },
      },
    })
  })
})
