import { DreamSerializers } from '../../../../../src/index.js'
import ObjectSerializerBuilder from '../../../../../src/serializer/builders/ObjectSerializerBuilder.js'
import ObjectSerializer from '../../../../../src/serializer/ObjectSerializer.js'
import ApplicationModel from '../../../../../test-app/app/models/ApplicationModel.js'

class ModelForOpenapiTypeSpecs {
  public favoriteJsons: object[]
  public requiredFavoriteJsons: object[]
  public favoriteJsonbs: object[]
  public requiredFavoriteJsonbs: object[]
  public jsonData: object
  public requiredJsonData: object
  public jsonbData: object
  public requiredJsonbData: object
  public requiredNicknames: string[]

  constructor({
    favoriteJsons,
    requiredFavoriteJsons,
    favoriteJsonbs,
    requiredFavoriteJsonbs,
    jsonData,
    requiredJsonData,
    jsonbData,
    requiredJsonbData,
    requiredNicknames,
  }: {
    favoriteJsons: object[]
    requiredFavoriteJsons: object[]
    favoriteJsonbs: object[]
    requiredFavoriteJsonbs: object[]
    jsonData: object
    requiredJsonData: object
    jsonbData: object
    requiredJsonbData: object
    requiredNicknames: string[]
  }) {
    this.favoriteJsons = favoriteJsons
    this.requiredFavoriteJsons = requiredFavoriteJsons
    this.favoriteJsonbs = favoriteJsonbs
    this.requiredFavoriteJsonbs = requiredFavoriteJsonbs
    this.jsonData = jsonData
    this.requiredJsonData = requiredJsonData
    this.jsonbData = jsonbData
    this.requiredJsonbData = requiredJsonbData
    this.requiredNicknames = requiredNicknames
  }

  public get serializers(): DreamSerializers<ApplicationModel> {
    return {
      default: 'view-model/PetSerializer',
      summary: 'view-model/PetSummarySerializer',
    }
  }
}

describe('ObjectSerializer (on a view model) json attributes', () => {
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

    let serializer: ObjectSerializerBuilder<ModelForOpenapiTypeSpecs, any>

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
      ObjectSerializer(data).attribute('requiredNicknames', {
        openapi: 'string[]',
      })

    context('snake casing is specified', () => {
      it('renders all attribute keys in snake case', () => {
        const serializer = MySerializer(fleshedOutModelForOpenapiTypeSpecs())
        expect(serializer.render({}, { casing: 'snake' })).toEqual({
          required_nicknames: ['Chuck'],
        })
      })
    })

    context('camel casing is specified', () => {
      it('renders all attribute keys in camel case', () => {
        const serializer = MySerializer(fleshedOutModelForOpenapiTypeSpecs())
        expect(serializer.render({}, { casing: 'camel' })).toEqual({
          requiredNicknames: ['Chuck'],
        })
      })
    })
  })
})

export default function fleshedOutModelForOpenapiTypeSpecs() {
  return new ModelForOpenapiTypeSpecs({
    favoriteJsons: [{ hello: 'world' }],
    requiredFavoriteJsons: [{ hello: 'world' }],
    favoriteJsonbs: [{ hello: 'world' }],
    requiredFavoriteJsonbs: [{ hello: 'world' }],

    jsonData: { hello: '1' },
    requiredJsonData: { hello: '2' },
    jsonbData: { hello: '3' },
    requiredJsonbData: { hello: '4' },
    requiredNicknames: ['Chuck'],
  })
}
