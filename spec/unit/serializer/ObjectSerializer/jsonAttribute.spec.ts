import ObjectSerializerBuilder from '../../../../src/serializer/builders/ObjectSerializerBuilder.js'
import ObjectSerializer from '../../../../src/serializer/ObjectSerializer.js'

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

describe('ObjectSerializer json attributes', () => {
  context('all Dream column types', () => {
    const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
      ObjectSerializer(data)
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
    let serializer: ObjectSerializerBuilder<any, any>

    beforeEach(() => {
      serializer = MySerializer(fleshedOutModelForOpenapiTypeSpecs())
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
      ObjectSerializer(data).attribute('requiredFavoriteJsons', { openapi: { type: 'object' } })

    context('snake casing is specified', () => {
      it('renders all attribute keys in snake case', () => {
        const serializer = MySerializer(fleshedOutModelForOpenapiTypeSpecs())
        expect(serializer.render({}, { casing: 'snake' })).toEqual({
          required_favorite_jsons: [{ hello: 'world' }],
        })
      })
    })

    context('camel casing is specified', () => {
      it('renders all attribute keys in camel case', () => {
        const serializer = MySerializer(fleshedOutModelForOpenapiTypeSpecs())
        expect(serializer.render({}, { casing: 'camel' })).toEqual({
          requiredFavoriteJsons: [{ hello: 'world' }],
        })
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
