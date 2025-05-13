import { DreamSerializer, DreamSerializerBuilder } from '../../../../src/serializer/index.js'
import SerializerOpenapiRenderer from '../../../../src/serializer/SerializerOpenapiRenderer.js'
import SerializerRenderer from '../../../../src/serializer/SerializerRenderer.js'
import ModelForOpenapiTypeSpecs from '../../../../test-app/app/models/ModelForOpenapiTypeSpec.js'
import fleshedOutModelForOpenapiTypeSpecs from '../../../scaffold/fleshedOutModelForOpenapiTypeSpecs.js'

describe('DreamSerializer json attributes', () => {
  context('all Dream column types', () => {
    const MySerializer = ($data: ModelForOpenapiTypeSpecs) =>
      DreamSerializer(ModelForOpenapiTypeSpecs, $data)
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
    let serializer: DreamSerializerBuilder<typeof ModelForOpenapiTypeSpecs, ModelForOpenapiTypeSpecs, any>

    beforeEach(async () => {
      serializer = MySerializer(await fleshedOutModelForOpenapiTypeSpecs())
    })

    it('serialize correctly', () => {
      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer['renderedAttributes']).toEqual({
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
      DreamSerializer(ModelForOpenapiTypeSpecs, $data).attribute('requiredNicknames')

    context('snake casing is specified', () => {
      it('renders all attribute keys in snake case', async () => {
        const serializer = MySerializer(await fleshedOutModelForOpenapiTypeSpecs())
        const serializerRenderer = new SerializerRenderer(serializer)
        expect(serializerRenderer.casing('snake')['renderedAttributes']).toEqual({
          required_nicknames: ['Chuck'],
        })

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
        expect(serializerOpenapiRenderer.casing('snake')['renderedOpenapiAttributes']).toEqual(
          expect.objectContaining({
            required_nicknames: { type: 'array', items: { type: 'string' } },
          })
        )
      })
    })

    context('camel casing is specified', () => {
      it('renders all attribute keys in camel case', async () => {
        const serializer = MySerializer(await fleshedOutModelForOpenapiTypeSpecs())
        const serializerRenderer = new SerializerRenderer(serializer)
        expect(serializerRenderer.casing('camel')['renderedAttributes']).toEqual({
          requiredNicknames: ['Chuck'],
        })

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
        expect(serializerOpenapiRenderer.casing('camel')['renderedOpenapiAttributes']).toEqual(
          expect.objectContaining({
            requiredNicknames: { type: 'array', items: { type: 'string' } },
          })
        )
      })
    })
  })
})
