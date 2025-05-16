import { DreamSerializerBuilder, SimpleObjectSerializer } from '../../../../src/serializer/index.js'
import SerializerOpenapiRenderer from '../../../../src/serializer/SerializerOpenapiRenderer.js'
import SerializerRenderer from '../../../../src/serializer/SerializerRenderer.js'

interface ModelForOpenapiTypeSpecs {
  favoriteJsons: object[]
  requiredFavoriteJsons: object[]
  favoriteJsonbs: object[]
  requiredFavoriteJsonbs: object[]
  jsonData: object
  requiredJsonData: object
  jsonbData: object
  requiredJsonbData: object
}

describe('SimpleObjectSerializer json attributes', () => {
  context('all Dream column types', () => {
    const MySerializer = ($data: ModelForOpenapiTypeSpecs) =>
      SimpleObjectSerializer($data)
        .jsonAttribute('favoriteJsons', {
          type: ['array', 'null'],
          items: { type: 'object', properties: { hello: 'string' } },
        })
        .jsonAttribute('requiredFavoriteJsons', {
          type: 'array',
          items: { type: 'object', properties: { hello: 'string' } },
        })
        .jsonAttribute('favoriteJsonbs', {
          type: ['array', 'null'],
          items: { type: 'object', properties: { hello: 'string' } },
        })
        .jsonAttribute('requiredFavoriteJsonbs', {
          type: 'array',
          items: { type: 'object', properties: { hello: 'string' } },
        })
        .jsonAttribute('jsonData', { type: ['object', 'null'], properties: { hello: 'string' } })
        .jsonAttribute('requiredJsonData', { type: 'object', properties: { hello: 'string' } })
        .jsonAttribute('jsonbData', { type: ['object', 'null'], properties: { hello: 'string' } })
        .jsonAttribute('requiredJsonbData', { type: 'object', properties: { hello: 'string' } })
    let serializer: DreamSerializerBuilder<undefined, ModelForOpenapiTypeSpecs, any>

    beforeEach(() => {
      serializer = MySerializer(fleshedOutModelForOpenapiTypeSpecs())
    })

    it('serialize correctly', () => {
      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer.render()).toEqual({
        favoriteJsons: [{ hello: 'world' }],
        requiredFavoriteJsons: [{ hello: 'world' }],
        favoriteJsonbs: [{ hello: 'world' }],
        requiredFavoriteJsonbs: [{ hello: 'world' }],

        jsonData: { hello: '1' },
        requiredJsonData: { hello: '2' },
        jsonbData: { hello: '3' },
        requiredJsonbData: { hello: '4' },
      })
    })

    it('have the correct OpenAPI shape', () => {
      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
        favoriteJsons: {
          type: ['array', 'null'],
          items: { type: 'object', properties: { hello: 'string' } },
        },
        requiredFavoriteJsons: { type: 'array', items: { type: 'object', properties: { hello: 'string' } } },
        favoriteJsonbs: {
          type: ['array', 'null'],
          items: { type: 'object', properties: { hello: 'string' } },
        },
        requiredFavoriteJsonbs: { type: 'array', items: { type: 'object', properties: { hello: 'string' } } },

        jsonData: { type: ['object', 'null'], properties: { hello: 'string' } },
        requiredJsonData: { type: 'object', properties: { hello: 'string' } },
        jsonbData: { type: ['object', 'null'], properties: { hello: 'string' } },
        requiredJsonbData: { type: 'object', properties: { hello: 'string' } },
      })
    })
  })

  context('with casing specified', () => {
    const MySerializer = ($data: ModelForOpenapiTypeSpecs) =>
      SimpleObjectSerializer($data).attribute('requiredFavoriteJsons', { $ref: 'hello/world' })

    context('snake casing is specified', () => {
      it('renders all attribute keys in snake case', () => {
        const serializer = MySerializer(fleshedOutModelForOpenapiTypeSpecs())
        const serializerRenderer = new SerializerRenderer(serializer)
        expect(serializerRenderer.casing('snake').render()).toEqual({
          required_favorite_jsons: [{ hello: 'world' }],
        })

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
        expect(serializerOpenapiRenderer.casing('snake')['renderedOpenapiAttributes']).toEqual(
          expect.objectContaining({
            required_favorite_jsons: { $ref: 'hello/world' },
          })
        )
      })
    })

    context('camel casing is specified', () => {
      it('renders all attribute keys in camel case', () => {
        const serializer = MySerializer(fleshedOutModelForOpenapiTypeSpecs())
        const serializerRenderer = new SerializerRenderer(serializer)
        expect(serializerRenderer.casing('camel').render()).toEqual({
          requiredFavoriteJsons: [{ hello: 'world' }],
        })

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
        expect(serializerOpenapiRenderer.casing('camel')['renderedOpenapiAttributes']).toEqual(
          expect.objectContaining({
            requiredFavoriteJsons: { $ref: 'hello/world' },
          })
        )
      })
    })
  })
})

export default function fleshedOutModelForOpenapiTypeSpecs() {
  return {
    favoriteJsons: [{ hello: 'world' }],
    requiredFavoriteJsons: [{ hello: 'world' }],
    favoriteJsonbs: [{ hello: 'world' }],
    requiredFavoriteJsonbs: [{ hello: 'world' }],

    jsonData: { hello: '1' },
    requiredJsonData: { hello: '2' },
    jsonbData: { hello: '3' },
    requiredJsonbData: { hello: '4' },
  }
}
