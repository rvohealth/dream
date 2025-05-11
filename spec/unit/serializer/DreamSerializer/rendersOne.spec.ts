import { CalendarDate, DreamSerializer } from '../../../../src/index.js'
import SerializerOpenapiRenderer from '../../../../src/serializer/SerializerOpenapiRenderer.js'
import SerializerRenderer from '../../../../src/serializer/SerializerRenderer.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import User from '../../../../test-app/app/models/User.js'
import { SpeciesValues } from '../../../../test-app/types/db.js'

describe('DreamSerializer rendersOne', () => {
  it('renders the Dream model’s default serializer', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = User.new({ id: '7', name: 'Charlie', birthdate })
    const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

    const MySerializer = (data: Pet) => DreamSerializer(Pet, data).rendersOne('user')

    const serializer = MySerializer(pet)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      user: {
        id: user.id,
        name: 'Charlie',
        birthdate: expect.toEqualCalendarDate(birthdate),
      },
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      user: {
        $ref: '#/components/schemas/UserSerializer',
      },
    })
  })

  context('when the associated attributes are null', () => {
    it('it renders the flattened attributes as null', () => {
      const user = User.new({ id: '7', name: null, birthdate: null })
      const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

      const MySerializer = (data: Pet) => DreamSerializer(Pet, data).attribute('species').rendersOne('user')

      const serializer = MySerializer(pet)

      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer.render()).toEqual({
        species: 'dog',
        user: {
          id: user.id,
          name: null,
          birthdate: null,
        },
      })
    })
  })

  context('when the associated attributes are undefined', () => {
    it('it renders the flattened attributes as null', () => {
      const user = User.new({ id: '7' })
      const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

      const MySerializer = (data: Pet) => DreamSerializer(Pet, data).attribute('species').rendersOne('user')

      const serializer = MySerializer(pet)

      const serializerRenderer = new SerializerRenderer(serializer)

      expect(serializerRenderer.render()).toEqual({
        species: 'dog',
        user: {
          id: user.id,
          name: null,
          birthdate: null,
        },
      })
    })
  })

  context('when the associated model is null', () => {
    it('it renders the flattened attributes as null', () => {
      const user = null
      const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

      const MySerializer = (data: Pet) => DreamSerializer(Pet, data).attribute('species').rendersOne('user')

      const serializer = MySerializer(pet)

      const serializerRenderer = new SerializerRenderer(serializer)

      expect(serializerRenderer.render()).toEqual({
        species: 'dog',
        user: null,
      })
    })
  })

  it('supports specifying a specific serializerKey', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = User.new({ id: '7', name: 'Charlie', birthdate, favoriteWord: 'hello' })
    const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

    const MySerializer = (data: Pet) =>
      DreamSerializer(Pet, data).rendersOne('user', { serializerKey: 'summary' })

    const serializer = MySerializer(pet)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      user: {
        id: user.id,
        favoriteWord: 'hello',
      },
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      user: {
        $ref: '#/components/schemas/UserSummarySerializer',
      },
    })
  })

  it("supports customizing the name of the thing rendered via { as: '...' } (replaces `source: string`)", () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = User.new({ id: '7', name: 'Charlie', birthdate })
    const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

    const MySerializer = (data: Pet) => DreamSerializer(Pet, data).rendersOne('user', { as: 'user2' })

    const serializer = MySerializer(pet)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      user2: {
        id: user.id,
        name: 'Charlie',
        birthdate: expect.toEqualCalendarDate(birthdate),
      },
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      user2: {
        $ref: '#/components/schemas/UserSerializer',
      },
    })
  })

  context('flatten', () => {
    it('it renders the serialized data into this model and adjusts the OpenAPI spec accordingly', () => {
      const birthdate = CalendarDate.fromISO('1950-10-02')
      const user = User.new({ id: '7', name: 'Charlie', birthdate })
      const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

      const MySerializer = (data: Pet) =>
        DreamSerializer(Pet, data).attribute('species').rendersOne('user', { flatten: true })

      const serializer = MySerializer(pet)

      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer.render()).toEqual({
        species: 'dog',
        id: user.id,
        name: 'Charlie',
        birthdate: expect.toEqualCalendarDate(birthdate),
      })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer.renderedOpenapi).toEqual({
        allOf: [
          {
            type: 'object',
            required: ['species'],
            properties: {
              species: { type: ['string', 'null'], enum: SpeciesValues },
            },
          },
          {
            $ref: '#/components/schemas/UserSerializer',
          },
        ],
      })
    })

    context('when the associated attributes are null', () => {
      it('it renders the flattened attributes as null', () => {
        const user = User.new({ id: '7', name: null, birthdate: null })
        const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

        const MySerializer = (data: Pet) =>
          DreamSerializer(Pet, data).attribute('species').rendersOne('user', { flatten: true })

        const serializer = MySerializer(pet)

        const serializerRenderer = new SerializerRenderer(serializer)
        expect(serializerRenderer.render()).toEqual({
          species: 'dog',
          id: user.id,
          name: null,
          birthdate: null,
        })
      })
    })

    context('when the associated attributes are undefined', () => {
      it('it renders the flattened attributes as null', () => {
        const user = User.new({ id: '7' })
        const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

        const MySerializer = (data: Pet) =>
          DreamSerializer(Pet, data).attribute('species').rendersOne('user', { flatten: true })

        const serializer = MySerializer(pet)

        const serializerRenderer = new SerializerRenderer(serializer)
        expect(serializerRenderer.render()).toEqual({
          species: 'dog',
          id: user.id,
          name: null,
          birthdate: null,
        })
      })
    })

    context('when the associated model is null', () => {
      it('it renders the flattened attributes as null', () => {
        const user = null
        const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

        const MySerializer = (data: Pet) =>
          DreamSerializer(Pet, data).attribute('species').rendersOne('user', { flatten: true })

        const serializer = MySerializer(pet)

        const serializerRenderer = new SerializerRenderer(serializer)
        expect(serializerRenderer.render()).toEqual({
          species: 'dog',
          id: null,
          name: null,
          birthdate: null,
        })
      })
    })
  })

  it('supports supplying a custom serializer', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = User.new({ id: '7', name: 'Charlie', birthdate })
    const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

    const CustomSerializer = (data: User) => DreamSerializer(User, data).attribute('name')
    ;(CustomSerializer as any)['globalName'] = 'CustomUserSerializer'
    const MySerializer = (data: Pet) =>
      DreamSerializer(Pet, data).rendersOne('user', { serializerCallback: () => CustomSerializer })

    const serializer = MySerializer(pet)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      user: {
        name: 'Charlie',
      },
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      user: {
        $ref: '#/components/schemas/CustomUserSerializer',
      },
    })
  })

  it('passes passthrough data', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = User.new({ id: '7', name: 'Charlie', birthdate })
    const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

    interface PassthroughData {
      locale: 'en-US' | 'es-ES'
    }

    const CustomSerializer = (data: User, passthroughData: PassthroughData) =>
      DreamSerializer(User, data, passthroughData).customAttribute(
        'title',
        (data, passthroughData) => `${passthroughData.locale}-${data.name}`,
        { openapi: 'string' }
      )
    ;(CustomSerializer as any)['globalName'] = 'CustomUserSerializer'
    const MySerializer = (data: Pet) =>
      DreamSerializer(Pet, data).rendersOne('user', { serializerCallback: () => CustomSerializer })

    const serializer = MySerializer(pet)

    const serializerRenderer = new SerializerRenderer(serializer, { locale: 'en-US' })
    expect(serializerRenderer.render()).toEqual({
      user: {
        title: 'en-US-Charlie',
      },
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      user: {
        $ref: '#/components/schemas/CustomUserSerializer',
      },
    })
  })
})
