import DreamSerializerBuilder from '../../../../src/serializer/builders/DreamSerializerBuilder.js'
import DreamSerializer from '../../../../src/serializer/DreamSerializer.js'
import SerializerOpenapiRenderer from '../../../../src/serializer/SerializerOpenapiRenderer.js'
import SerializerRenderer from '../../../../src/serializer/SerializerRenderer.js'
import ModelForOpenapiTypeSpecs from '../../../../test-app/app/models/ModelForOpenapiTypeSpec.js'
import User from '../../../../test-app/app/models/User.js'
import { PetTreatsEnumValues, SpeciesTypesEnumValues } from '../../../../test-app/types/db.js'
import fleshedOutModelForOpenapiTypeSpecs from '../../../scaffold/fleshedOutModelForOpenapiTypeSpecs.js'

describe('DreamSerializer attributes', () => {
  it('can render Dream attributes', () => {
    const MySerializer = (data: User) => DreamSerializer(User, data).attribute('email')

    const serializer = MySerializer(User.new({ email: 'abc', password: '123' }))

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      email: 'abc',
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      email: {
        type: 'string',
      },
    })
  })

  it('can render virtual Dream attributes', () => {
    const MySerializer = (data: User) => DreamSerializer(User, data).attribute('lbs', { openapi: 'decimal' })

    const serializer = MySerializer(User.new({ lbs: 180.1 }))

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      lbs: 180.1,
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      lbs: {
        type: 'number',
        format: 'decimal',
      },
    })
  })

  it('supports customizing the name of the thing rendered', () => {
    const MySerializer = (data: User) => DreamSerializer(User, data).attribute('email', { as: 'email2' })

    const serializer = MySerializer(User.new({ email: 'abc', password: '123' }))

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      email2: 'abc',
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      email2: {
        type: 'string',
      },
    })
  })

  it('can specify OpenAPI description', () => {
    const MySerializer = (data: User) =>
      DreamSerializer(User, data).attribute('email', { openapi: { description: 'This is an email' } })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      email: {
        type: 'string',
        description: 'This is an email',
      },
    })
  })

  context('when serializing null', () => {
    it('renders null', () => {
      const MySerializer = (data: User | null) => DreamSerializer(User, data).attribute('email')

      const serializer = MySerializer(null)
      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer.render()).toBeNull()
    })
  })

  context('when serializing a null attribute', () => {
    it('the attribute is rendered as null', () => {
      const MySerializer = (data: User | null) => DreamSerializer(User, data).attribute('name')

      const serializer = MySerializer(User.new({ name: null }))
      const serializerRenderer = new SerializerRenderer(serializer)

      expect(serializerRenderer.render()).toEqual({
        name: null,
      })
    })
  })

  context('when serializing an undefined attribute', () => {
    it('the attribute is rendered as null', () => {
      const MySerializer = (data: User | null) => DreamSerializer(User, data).attribute('name')

      const serializer = MySerializer(User.new({}))
      const serializerRenderer = new SerializerRenderer(serializer)

      expect(serializerRenderer.render()).toEqual({
        name: null,
      })
    })
  })

  it('can render attributes from serializers that "extend" other serializers', () => {
    const BaseSerializer = (data: User) => DreamSerializer(User, data).attribute('name')
    const MySerializer = (data: User) => BaseSerializer(data).attribute('email')

    const serializer = MySerializer(User.new({ name: 'Snoopy', email: 'abc', password: '123' }))

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      name: 'Snoopy',
      email: 'abc',
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      name: {
        type: ['string', 'null'],
      },
      email: {
        type: 'string',
      },
    })
  })

  context('all Dream column types', () => {
    const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
      DreamSerializer(ModelForOpenapiTypeSpecs, data)
        .attribute('name')
        .attribute('nicknames')
        .attribute('requiredNicknames')
        .attribute('email')
        .attribute('birthdate')
        .attribute('aDatetime')

        .attribute('volume')

        // begin: favorite records (used for checking type validation in Params.for)
        .attribute('favoriteCitext')
        .attribute('requiredFavoriteCitext')
        .attribute('favoriteCitexts')
        .attribute('requiredFavoriteCitexts')
        .attribute('favoriteUuids')
        .attribute('requiredFavoriteUuids')
        .attribute('favoriteDates')
        .attribute('requiredFavoriteDates')
        .attribute('favoriteDatetimes')
        .attribute('requiredFavoriteDatetimes')
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
        .attribute('favoriteTexts')
        .attribute('requiredFavoriteTexts')
        .attribute('favoriteNumerics')
        .attribute('requiredFavoriteNumerics')
        .attribute('favoriteBooleans')
        .attribute('requiredFavoriteBooleans')
        .attribute('favoriteBigint')
        .attribute('requiredFavoriteBigint')
        .attribute('favoriteBigints')
        .attribute('requiredFavoriteBigints')
        .attribute('favoriteIntegers')
        .attribute('requiredFavoriteIntegers')
        // end: favorite records

        .attribute('bio')
        .attribute('notes')
        .jsonAttribute('jsonData', { openapi: { type: ['object', 'null'], properties: { hello: 'string' } } })
        .jsonAttribute('requiredJsonData', { openapi: { type: 'object', properties: { hello: 'string' } } })
        .jsonAttribute('jsonbData', {
          openapi: { type: ['object', 'null'], properties: { hello: 'string' } },
        })
        .jsonAttribute('requiredJsonbData', { openapi: { type: 'object', properties: { hello: 'string' } } })
        .attribute('uuid')
        .attribute('optionalUuid')

        .attribute('species')
        .attribute('favoriteTreats')
        .attribute('collarCount')
        .attribute('collarCountInt')
        .attribute('collarCountNumeric')
        .attribute('requiredCollarCount')
        .attribute('requiredCollarCountInt')
        .attribute('likesWalks')
        .attribute('likesTreats')
        .attribute('likesTreats')

    let serializer: DreamSerializerBuilder<typeof ModelForOpenapiTypeSpecs, ModelForOpenapiTypeSpecs, any>

    beforeEach(async () => {
      serializer = MySerializer(await fleshedOutModelForOpenapiTypeSpecs())
    })

    it('serialize correctly', () => {
      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer.render()).toEqual({
        name: 'Charles Brown',
        nicknames: ['Charlie', 'Chuck'],
        requiredNicknames: ['Chuck'],
        email: 'charlie@peanuts.com',
        birthdate: '1950-10-02',
        aDatetime: '1950-10-02T00:00:00.000Z',

        volume: 7.778,

        // begin: favorite records (used for checking type validation in Params.for)
        favoriteCitext: 'hello',
        requiredFavoriteCitext: 'world',
        favoriteCitexts: ['hello', 'world'],
        requiredFavoriteCitexts: ['world'],
        favoriteUuids: ['8773f04c-affc-4389-9fb5-121679949589', '3bce3b47-937e-461e-be84-46673155a8ba'],
        requiredFavoriteUuids: ['3bce3b47-937e-461e-be84-46673155a8ba'],
        favoriteDates: ['2025-05-12', '2025-05-13'],
        requiredFavoriteDates: ['2025-05-13'],
        favoriteDatetimes: ['2025-05-12T00:00:00.000Z', '2025-05-13T00:00:00.000Z'],
        requiredFavoriteDatetimes: ['2025-05-13T00:00:00.000Z'],
        favoriteJsons: [{ hello: 'world' }],
        requiredFavoriteJsons: [{ hello: 'world' }],
        favoriteJsonbs: [{ hello: 'world' }],
        requiredFavoriteJsonbs: [{ hello: 'world' }],
        favoriteTexts: ['hello', 'world'],
        requiredFavoriteTexts: ['world'],
        favoriteNumerics: [3.3, 7.7],
        requiredFavoriteNumerics: [7.7],
        favoriteBooleans: [true, false, true],
        requiredFavoriteBooleans: [true, false],
        favoriteBigint: '123456789098',
        requiredFavoriteBigint: '123456789098',
        favoriteBigints: ['123456789098'],
        requiredFavoriteBigints: ['123456789098'],
        favoriteIntegers: [3, 7],
        requiredFavoriteIntegers: [7],
        // end: favorite records

        bio: 'hello',
        notes: 'hello world',
        jsonData: { hello: '1' },
        requiredJsonData: { hello: '2' },
        jsonbData: { hello: '3' },
        requiredJsonbData: { hello: '4' },
        uuid: '8773f04c-affc-4389-9fb5-121679949589',
        optionalUuid: '8773f04c-affc-4389-9fb5-121679949589',

        species: 'cat',
        favoriteTreats: ['efishy feesh'],
        collarCount: '3',
        collarCountInt: 7,
        collarCountNumeric: 3.3,
        requiredCollarCount: '3',
        requiredCollarCountInt: 3,
        likesWalks: true,
        likesTreats: false,
      })
    })

    it('have the correct OpenAPI shape', () => {
      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        name: { type: ['string', 'null'] },
        nicknames: { type: ['array', 'null'], items: { type: 'string' } },
        requiredNicknames: { type: 'array', items: { type: 'string' } },
        email: { type: 'string' },
        birthdate: { type: ['string', 'null'], format: 'date' },
        aDatetime: { type: ['string', 'null'], format: 'date-time' },

        volume: { type: ['number', 'null'], format: 'decimal' },

        // begin: favorite records (used for checking type validation in Params.for)
        favoriteCitext: { type: ['string', 'null'] },
        requiredFavoriteCitext: { type: 'string' },
        favoriteCitexts: { type: ['array', 'null'], items: { type: 'string' } },
        requiredFavoriteCitexts: { type: 'array', items: { type: 'string' } },
        favoriteUuids: { type: ['array', 'null'], items: { type: 'string' } },
        requiredFavoriteUuids: { type: 'array', items: { type: 'string' } },
        favoriteDates: { type: ['array', 'null'], items: { type: 'string', format: 'date' } },
        requiredFavoriteDates: { type: 'array', items: { type: 'string', format: 'date' } },
        favoriteDatetimes: { type: ['array', 'null'], items: { type: 'string', format: 'date-time' } },
        requiredFavoriteDatetimes: { type: 'array', items: { type: 'string', format: 'date-time' } },
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
        favoriteTexts: { type: ['array', 'null'], items: { type: 'string' } },
        requiredFavoriteTexts: { type: 'array', items: { type: 'string' } },
        favoriteNumerics: { type: ['array', 'null'], items: { type: 'number', format: 'decimal' } },
        requiredFavoriteNumerics: { type: 'array', items: { type: 'number', format: 'decimal' } },
        favoriteBooleans: { type: ['array', 'null'], items: { type: 'boolean' } },
        requiredFavoriteBooleans: { type: 'array', items: { type: 'boolean' } },
        favoriteBigint: { type: ['string', 'null'] },
        requiredFavoriteBigint: { type: 'string' },
        favoriteBigints: { type: ['array', 'null'], items: { type: 'string' } },
        requiredFavoriteBigints: { type: 'array', items: { type: 'string' } },
        favoriteIntegers: { type: ['array', 'null'], items: { type: 'integer' } },
        requiredFavoriteIntegers: { type: 'array', items: { type: 'integer' } },
        // end: favorite records

        bio: { type: 'string' },
        notes: { type: ['string', 'null'] },
        jsonData: { type: ['object', 'null'], properties: { hello: 'string' } },
        requiredJsonData: { type: 'object', properties: { hello: 'string' } },
        jsonbData: { type: ['object', 'null'], properties: { hello: 'string' } },
        requiredJsonbData: { type: 'object', properties: { hello: 'string' } },
        uuid: { type: 'string' },
        optionalUuid: { type: ['string', 'null'] },

        species: { type: ['string', 'null'], enum: SpeciesTypesEnumValues },
        favoriteTreats: {
          type: ['array', 'null'],
          items: { type: 'string', enum: PetTreatsEnumValues },
        },
        collarCount: { type: ['string', 'null'] },
        collarCountInt: { type: ['integer', 'null'] },
        collarCountNumeric: { type: ['number', 'null'], format: 'decimal' },
        requiredCollarCount: { type: 'string' },
        requiredCollarCountInt: { type: 'integer' },
        likesWalks: { type: ['boolean', 'null'] },
        likesTreats: { type: 'boolean' },
      })
    })

    context('suppressResponseEnums: true', () => {
      it('renders a description with the enums rather than proper enums', () => {
        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer, {
          suppressResponseEnums: true,
        })
        expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual(
          expect.objectContaining({
            species: {
              type: ['string', 'null'],
              description: `The following values will be allowed:
  cat,
  noncat`,
            },
            favoriteTreats: {
              type: ['array', 'null'],
              items: {
                type: 'string',
                description: `The following values will be allowed:
  efishy feesh,
  snick snowcks`,
              },
            },
          })
        )
      })
    })
  })

  context('numeric/decimal with precision', () => {
    it('rounds to specified precision', async () => {
      const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
        DreamSerializer(ModelForOpenapiTypeSpecs, data).attribute('volume', { precision: 1 })
      const serializer = MySerializer(await fleshedOutModelForOpenapiTypeSpecs())
      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer.render()).toEqual({
        volume: 7.8,
      })
    })
  })

  context('with casing specified', () => {
    const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
      DreamSerializer(ModelForOpenapiTypeSpecs, data).attribute('requiredNicknames')

    context('snake casing is specified', () => {
      it('renders all attribute keys in snake case', async () => {
        const serializer = MySerializer(await fleshedOutModelForOpenapiTypeSpecs())
        const serializerRenderer = new SerializerRenderer(serializer, {}, { casing: 'snake' })
        expect(serializerRenderer.render()).toEqual({
          required_nicknames: ['Chuck'],
        })

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer, { casing: 'snake' })
        expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual(
          expect.objectContaining({
            required_nicknames: { type: 'array', items: { type: 'string' } },
          })
        )
      })
    })

    context('camel casing is specified', () => {
      it('renders all attribute keys in camel case', async () => {
        const serializer = MySerializer(await fleshedOutModelForOpenapiTypeSpecs())
        const serializerRenderer = new SerializerRenderer(serializer, {}, { casing: 'camel' })
        expect(serializerRenderer.render()).toEqual({
          requiredNicknames: ['Chuck'],
        })

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer, { casing: 'camel' })
        expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual(
          expect.objectContaining({
            requiredNicknames: { type: 'array', items: { type: 'string' } },
          })
        )
      })
    })
  })
})
