import DreamSerializerBuilder from '../../../../src/serializer/builders/DreamSerializerBuilder.js'
import DreamSerializer from '../../../../src/serializer/DreamSerializer.js'
import ModelForOpenapiTypeSpecs from '../../../../test-app/app/models/ModelForOpenapiTypeSpec.js'
import fleshedOutModelForOpenapiTypeSpecs from '../../../scaffold/fleshedOutModelForOpenapiTypeSpecs.js'

describe('DreamSerializer json attributes', () => {
  context('all Dream column types', () => {
    const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
      DreamSerializer(ModelForOpenapiTypeSpecs, data)
        .jsonAttribute('favoriteJsons', {
          openapi: {
            type: ['array', 'null'],
            items: { type: 'object', properties: { hello: 'string' } },
          },
        })
        .jsonAttribute('requiredFavoriteJsons', {
          openapi: {
            type: 'array',
            items: { type: 'object', properties: { hello: 'string' } },
          },
        })
        .jsonAttribute('favoriteJsonbs', {
          openapi: {
            type: ['array', 'null'],
            items: { type: 'object', properties: { hello: 'string' } },
          },
        })
        .jsonAttribute('requiredFavoriteJsonbs', {
          openapi: {
            type: 'array',
            items: { type: 'object', properties: { hello: 'string' } },
          },
        })
        .jsonAttribute('jsonData', { openapi: { type: ['object', 'null'], properties: { hello: 'string' } } })
        .jsonAttribute('requiredJsonData', { openapi: { type: 'object', properties: { hello: 'string' } } })
        .jsonAttribute('jsonbData', {
          openapi: { type: ['object', 'null'], properties: { hello: 'string' } },
        })
        .jsonAttribute('requiredJsonbData', { openapi: { type: 'object', properties: { hello: 'string' } } })
    let serializer: DreamSerializerBuilder<typeof ModelForOpenapiTypeSpecs, ModelForOpenapiTypeSpecs, any>

    beforeEach(async () => {
      serializer = MySerializer(await fleshedOutModelForOpenapiTypeSpecs())
    })

    it('serialize correctly', () => {
      expect(serializer.render()).toEqual({
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
  })

  context('with casing specified', () => {
    const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
      DreamSerializer(ModelForOpenapiTypeSpecs, data).jsonAttribute('jsonData', {
        openapi: { type: 'object', properties: { hello: { type: 'string' } } },
      })

    context('snake casing is specified', () => {
      it('renders all attribute keys in snake case', async () => {
        const serializer = MySerializer(await fleshedOutModelForOpenapiTypeSpecs())
        expect(serializer.render({}, { casing: 'snake' })).toEqual({
          json_data: { hello: '1' },
        })
      })
    })

    context('camel casing is specified', () => {
      it('renders all attribute keys in camel case', async () => {
        const serializer = MySerializer(await fleshedOutModelForOpenapiTypeSpecs())
        expect(serializer.render({}, { casing: 'camel' })).toEqual({
          jsonData: { hello: '1' },
        })
      })
    })
  })
})
