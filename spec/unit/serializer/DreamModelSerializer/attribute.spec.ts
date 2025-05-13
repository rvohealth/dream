import { CalendarDate, DateTime } from '../../../../src/index.js'
import { DreamModelSerializer, DreamSerializerBuilder } from '../../../../src/serializer/index.js'
import SerializerOpenapiRenderer from '../../../../src/serializer/SerializerOpenapiRenderer.js'
import SerializerRenderer from '../../../../src/serializer/SerializerRenderer.js'
import ModelForOpenapiTypeSpecs from '../../../../test-app/app/models/ModelForOpenapiTypeSpec.js'
import User from '../../../../test-app/app/models/User.js'
import { PetTreatsEnumValues, SpeciesTypesEnumValues } from '../../../../test-app/types/db.js'
import fleshedOutModelForOpenapiTypeSpecs from '../../../scaffold/fleshedOutModelForOpenapiTypeSpecs.js'

describe('DreamSerializer attributes', () => {
  it('can render Dream attributes', () => {
    const MySerializer = ($data: User) => DreamModelSerializer(User, $data).attribute('email')

    const serializer = MySerializer(User.new({ email: 'abc', password: '123' }))

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer['renderedAttributes']).toEqual({
      email: 'abc',
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(serializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      email: {
        type: 'string',
      },
    })

    expect(serializerOpenapiRenderer.renderedOpenapi).toEqual(
      expect.objectContaining({
        type: 'object',
      })
    )
  })

  it('can specify OpenAPI description', () => {
    const MySerializer = ($data: User) => DreamModelSerializer(User, $data).attribute('email', {})

    const serializer = MySerializer(User.new({ email: 'abc', password: '123' }))

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer['renderedAttributes']).toEqual({
      email: 'abc',
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(serializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      email: {
        type: 'string',
      },
    })

    expect(serializerOpenapiRenderer.renderedOpenapi).toEqual(
      expect.objectContaining({
        type: 'object',
      })
    )
  })

  context('when serializing null', () => {
    it('renders the attributes as null', () => {
      const MySerializer = ($data: User | null) =>
        DreamModelSerializer(User, $data).maybeNull().attribute('email')

      const serializer = MySerializer(null)
      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer['renderedAttributes']).toBeNull()

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(serializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
        email: {
          type: 'string',
        },
      })

      expect(serializerOpenapiRenderer.renderedOpenapi).toEqual(
        expect.objectContaining({
          type: ['object', 'null'],
        })
      )
    })
  })

  it('can render attributes from "extended" serializers', () => {
    const BaseSerializer = ($data: User) => DreamModelSerializer(User, $data).attribute('name')
    const MySerializer = ($data: User) => BaseSerializer($data).attribute('email')

    const serializer = MySerializer(User.new({ name: 'Snoopy', email: 'abc', password: '123' }))

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer['renderedAttributes']).toEqual({
      name: 'Snoopy',
      email: 'abc',
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(serializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      name: {
        type: ['string', 'null'],
      },
      email: {
        type: 'string',
      },
    })

    expect(serializerOpenapiRenderer.renderedOpenapi).toEqual(
      expect.objectContaining({
        type: 'object',
      })
    )
  })

  context('all Dream column types', () => {
    const MySerializer = ($data: ModelForOpenapiTypeSpecs) =>
      DreamModelSerializer(ModelForOpenapiTypeSpecs, $data)
        .attribute('name')
        .attribute('nicknames')
        .attribute('requiredNicknames')
        .attribute('email')
        .attribute('birthdate')

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
        .jsonAttribute('jsonData', { type: ['object', 'null'], properties: { hello: 'string' } })
        .jsonAttribute('requiredJsonData', { type: 'object', properties: { hello: 'string' } })
        .jsonAttribute('jsonbData', { type: ['object', 'null'], properties: { hello: 'string' } })
        .jsonAttribute('requiredJsonbData', { type: 'object', properties: { hello: 'string' } })
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

    let serializer: DreamSerializerBuilder<typeof ModelForOpenapiTypeSpecs, ModelForOpenapiTypeSpecs, any>

    beforeEach(async () => {
      serializer = MySerializer(await fleshedOutModelForOpenapiTypeSpecs())
    })

    it('serialize correctly', () => {
      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer['renderedAttributes']).toEqual({
        name: 'Charles Brown',
        nicknames: ['Charlie', 'Chuck'],
        requiredNicknames: ['Chuck'],
        email: 'charlie@peanuts.com',
        birthdate: expect.toEqualCalendarDate(CalendarDate.fromISO('1950-10-02')),

        volume: 7.778,

        // begin: favorite records (used for checking type validation in Params.for)
        favoriteCitext: 'hello',
        requiredFavoriteCitext: 'world',
        favoriteCitexts: ['hello', 'world'],
        requiredFavoriteCitexts: ['world'],
        favoriteUuids: ['8773f04c-affc-4389-9fb5-121679949589', '3bce3b47-937e-461e-be84-46673155a8ba'],
        requiredFavoriteUuids: ['3bce3b47-937e-461e-be84-46673155a8ba'],
        favoriteDates: [
          expect.toEqualCalendarDate(CalendarDate.fromISO('2025-05-12')),
          expect.toEqualCalendarDate(CalendarDate.fromISO('2025-05-13')),
        ],
        requiredFavoriteDates: [expect.toEqualCalendarDate(CalendarDate.fromISO('2025-05-13'))],
        favoriteDatetimes: [
          expect.toEqualDateTime(DateTime.fromISO('2025-05-12')),
          expect.toEqualDateTime(DateTime.fromISO('2025-05-13')),
        ],
        requiredFavoriteDatetimes: [expect.toEqualDateTime(DateTime.fromISO('2025-05-13'))],
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
      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(serializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
        name: { type: ['string', 'null'] },
        nicknames: { type: ['array', 'null'], items: { type: 'string' } },
        requiredNicknames: { type: 'array', items: { type: 'string' } },
        email: { type: 'string' },
        birthdate: { type: ['string', 'null'], format: 'date' },

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
  })

  context('numeric/decimal with precision', () => {
    it('rounds to specified precision', async () => {
      const MySerializer = ($data: ModelForOpenapiTypeSpecs) =>
        DreamModelSerializer(ModelForOpenapiTypeSpecs, $data).attribute('volume', {}, { precision: 1 })
      const serializer = MySerializer(await fleshedOutModelForOpenapiTypeSpecs())
      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer['renderedAttributes']).toEqual({
        volume: 7.8,
      })
    })
  })
})
