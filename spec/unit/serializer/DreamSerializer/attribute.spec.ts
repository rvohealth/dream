import CalendarDate from '../../../../src/helpers/CalendarDate.js'
import DreamSerializerBuilder from '../../../../src/serializer/builders/DreamSerializerBuilder.js'
import DreamSerializer from '../../../../src/serializer/DreamSerializer.js'
import ModelForOpenapiTypeSpecs from '../../../../test-app/app/models/ModelForOpenapiTypeSpec.js'
import User from '../../../../test-app/app/models/User.js'
import UserSerializer from '../../../../test-app/app/serializers/UserSerializer.js'
import fleshedOutModelForOpenapiTypeSpecs from '../../../scaffold/fleshedOutModelForOpenapiTypeSpecs.js'

describe('DreamSerializer#attribute', () => {
  it('can render Dream attributes', () => {
    const serializer = UserSerializer(
      User.new({
        id: '7',
        name: 'Charlie',
        birthdate: CalendarDate.fromISO('1950-10-02'),
        favoriteWord: 'football',
      })
    )

    expect(serializer.render()).toEqual({
      id: '7',
      name: 'Charlie',
      birthdate: '1950-10-02',
      favoriteWord: 'football',
    })
  })

  it('can render virtual Dream attributes', () => {
    const MySerializer = (data: User) => DreamSerializer(User, data).attribute('lbs', { openapi: 'decimal' })

    const serializer = MySerializer(User.new({ lbs: 180.1 }))

    expect(serializer.render()).toEqual({
      lbs: 180.1,
    })
  })

  it('can render virtual Dream attributes without specifying OpenAPI shape', () => {
    const MySerializer = (data: User) => DreamSerializer(User, data).attribute('lbs')

    const serializer = MySerializer(User.new({ lbs: 180.1 }))

    expect(serializer.render()).toEqual({
      lbs: 180.1,
    })
  })

  it('can render virtual Dream attributes specifying only a description in the OpenAPI shape', () => {
    const MySerializer = (data: User) =>
      DreamSerializer(User, data).attribute('lbs', { openapi: { description: 'Weight' } })

    const serializer = MySerializer(User.new({ lbs: 180.1 }))

    expect(serializer.render()).toEqual({
      lbs: 180.1,
    })
  })

  context('default value', () => {
    it('converts undefined to the default', () => {
      const MySerializer = (data: User) =>
        DreamSerializer(User, data).attribute('name', { default: 'Snoopy' })

      const serializer = MySerializer(User.new({}))

      expect(serializer.render()).toEqual({
        name: 'Snoopy',
      })
    })

    it('converts null to the default', () => {
      const MySerializer = (data: User) =>
        DreamSerializer(User, data).attribute('name', { default: 'Snoopy' })

      const serializer = MySerializer(User.new({ name: null }))

      expect(serializer.render()).toEqual({
        name: 'Snoopy',
      })
    })

    it('does not convert non-null, non-undefined falsey values to the default', () => {
      const MySerializer = (data: User) =>
        DreamSerializer(User, data).attribute('name', { default: 'Snoopy' })

      const serializer = MySerializer(User.new({ name: '' }))

      expect(serializer.render()).toEqual({
        name: '',
      })
    })

    context('when a default is not provided', () => {
      it('default doesn’t turn null into undefined', () => {
        const MySerializer = (data: User) => DreamSerializer(User, data).attribute('name')

        const serializer = MySerializer(User.new({ name: null }))

        expect(serializer.render()).toEqual({
          name: null,
        })
      })
    })
  })

  it('supports customizing the name of the thing rendered', () => {
    const MySerializer = (data: User) => DreamSerializer(User, data).attribute('email', { as: 'email2' })

    const serializer = MySerializer(User.new({ email: 'abc', password: '123' }))

    expect(serializer.render()).toEqual({
      email2: 'abc',
    })
  })

  context('when serializing null', () => {
    it('renders null', () => {
      const MySerializer = (data: User | null) => DreamSerializer(User, data).attribute('email')

      const serializer = MySerializer(null)
      expect(serializer.render()).toBeNull()
    })
  })

  context('when serializing a null attribute', () => {
    it('the attribute is rendered as null', () => {
      const MySerializer = (data: User | null) => DreamSerializer(User, data).attribute('name')

      const serializer = MySerializer(User.new({ name: null }))
      expect(serializer.render()).toEqual({
        name: null,
      })
    })
  })

  context('when serializing an undefined attribute', () => {
    it('the attribute is rendered as null', () => {
      const MySerializer = (data: User | null) => DreamSerializer(User, data).attribute('name')

      const serializer = MySerializer(User.new({}))
      expect(serializer.render()).toEqual({
        name: null,
      })
    })
  })

  it('can render attributes from serializers that "extend" other serializers', () => {
    const BaseSerializer = (data: User) => DreamSerializer(User, data).attribute('name')
    const MySerializer = (data: User) => BaseSerializer(data).attribute('email')

    const serializer = MySerializer(User.new({ name: 'Snoopy', email: 'abc', password: '123' }))

    expect(serializer.render()).toEqual({
      name: 'Snoopy',
      email: 'abc',
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
        .attribute('aSmallInteger')
        .attribute('anInteger')
        .attribute('aReal')

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
        .attribute('favoriteJsonbs', { openapi: 'string' })
        .attribute('favoriteJsons', {
          openapi: {
            type: ['array', 'null'],
            items: { type: 'object', properties: { hello: 'string' } },
          },
        })
        .attribute('requiredFavoriteJsons', {
          openapi: {
            type: 'array',
            items: { type: 'object', properties: { hello: 'string' } },
          },
        })
        .attribute('favoriteJsonbs', {
          openapi: {
            type: ['array', 'null'],
            items: { type: 'object', properties: { hello: 'string' } },
          },
        })
        .attribute('requiredFavoriteJsonbs', {
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
        .attribute('jsonData', { openapi: { type: ['object', 'null'], properties: { hello: 'string' } } })
        .attribute('requiredJsonData', { openapi: { type: 'object', properties: { hello: 'string' } } })
        .attribute('jsonbData', {
          openapi: { type: ['object', 'null'], properties: { hello: 'string' } },
        })
        .attribute('requiredJsonbData', { openapi: { type: 'object', properties: { hello: 'string' } } })
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
        .attribute('startTime')
        .attribute('endTime')
        .attribute('times')

    let serializer: DreamSerializerBuilder<typeof ModelForOpenapiTypeSpecs, ModelForOpenapiTypeSpecs, any>

    beforeEach(async () => {
      serializer = MySerializer(await fleshedOutModelForOpenapiTypeSpecs())
    })

    it('serialize correctly', () => {
      expect(serializer.render()).toEqual({
        name: 'Charles Brown',
        nicknames: ['Charlie', 'Chuck'],
        requiredNicknames: ['Chuck'],
        email: 'charlie@peanuts.com',
        birthdate: '1950-10-02',
        aDatetime: '1950-10-02T00:00:00.000Z',

        aSmallInteger: 7,
        anInteger: 77777777,
        aReal: 1.03e7,

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

        startTime: '10:30:00',
        endTime: '11:30:00',
        times: ['11:30:00', '12:30:00'],
      })
    })
  })

  context('numeric/decimal with precision', () => {
    it('rounds to specified precision', async () => {
      const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
        DreamSerializer(ModelForOpenapiTypeSpecs, data).attribute('volume', { precision: 1 })
      const serializer = MySerializer(await fleshedOutModelForOpenapiTypeSpecs())
      expect(serializer.render()).toEqual({
        volume: 7.8,
      })
    })
  })

  context('json attribute', () => {
    const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
      DreamSerializer(ModelForOpenapiTypeSpecs, data)
        .attribute('favoriteJsons', {
          openapi: {
            type: ['array', 'null'],
            items: { type: 'object', properties: { hello: 'string' } },
          },
        })
        .attribute('requiredFavoriteJsons', {
          openapi: {
            type: 'array',
            items: { type: 'object', properties: { hello: 'string' } },
          },
        })
        .attribute('favoriteJsonbs', {
          openapi: {
            type: ['array', 'null'],
            items: { type: 'object', properties: { hello: 'string' } },
          },
        })
        .attribute('requiredFavoriteJsonbs', {
          openapi: {
            type: 'array',
            items: { type: 'object', properties: { hello: 'string' } },
          },
        })
        .attribute('jsonData', { openapi: { type: ['object', 'null'], properties: { hello: 'string' } } })
        .attribute('requiredJsonData', { openapi: { type: 'object', properties: { hello: 'string' } } })
        .attribute('jsonbData', {
          openapi: { type: ['object', 'null'], properties: { hello: 'string' } },
        })
        .attribute('requiredJsonbData', { openapi: { type: 'object', properties: { hello: 'string' } } })
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
      DreamSerializer(ModelForOpenapiTypeSpecs, data).attribute('requiredNicknames')

    context('snake casing is specified', () => {
      it('renders all attribute keys in snake case', async () => {
        const serializer = MySerializer(await fleshedOutModelForOpenapiTypeSpecs())
        expect(serializer.render({}, { casing: 'snake' })).toEqual({
          required_nicknames: ['Chuck'],
        })
      })
    })

    context('camel casing is specified', () => {
      it('renders all attribute keys in camel case', async () => {
        const serializer = MySerializer(await fleshedOutModelForOpenapiTypeSpecs())
        expect(serializer.render({}, { casing: 'camel' })).toEqual({
          requiredNicknames: ['Chuck'],
        })
      })
    })
  })
})
