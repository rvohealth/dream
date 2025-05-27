import { OpenapiSchemaBodyShorthand } from '../../../src/index.js'
import allSerializersFromHandWrittenOpenapi from '../../../src/openapi/allSerializersFromHandWrittenOpenapi.js'
import AnimalSerializer from '../../../test-app/app/serializers/Balloon/Latex/AnimalSerializer.js'
import LatexSerializer from '../../../test-app/app/serializers/Balloon/LatexSerializer.js'
import MylarSerializer from '../../../test-app/app/serializers/Balloon/MylarSerializer.js'
import PetSerializer from '../../../test-app/app/serializers/PetSerializer.js'

describe('allSerializersFromHandWrittenOpenapi', () => {
  it('extracts all serializer references from an openapi shape', () => {
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

    const results = allSerializersFromHandWrittenOpenapi(openapi)

    expect(results).toHaveLength(4)
    expect(results).toEqual(
      expect.arrayContaining([AnimalSerializer, LatexSerializer, MylarSerializer, PetSerializer])
    )
  })
})
