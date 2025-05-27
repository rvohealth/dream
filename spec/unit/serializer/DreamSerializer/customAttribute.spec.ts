import { CalendarDate, round } from '../../../../src/index.js'
import DreamSerializer from '../../../../src/serializer/DreamSerializer.js'
import SerializerOpenapiRenderer from '../../../../src/serializer/SerializerOpenapiRenderer.js'
import SerializerRenderer from '../../../../src/serializer/SerializerRenderer.js'
import ModelForOpenapiTypeSpecs from '../../../../test-app/app/models/ModelForOpenapiTypeSpec.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import User from '../../../../test-app/app/models/User.js'
import UserSerializer from '../../../../test-app/app/serializers/UserSerializer.js'
import { SpeciesValues } from '../../../../test-app/types/db.js'
import fleshedOutModelForOpenapiTypeSpecs from '../../../scaffold/fleshedOutModelForOpenapiTypeSpecs.js'

describe('DreamSerializer customAttributes', () => {
  it('can render the results of calling the callback function', () => {
    const MySerializer = (user: User) =>
      DreamSerializer(User, user).customAttribute('email', () => `${user.email}@peanuts.com`, {
        openapi: 'string',
      })

    const serializer = MySerializer(User.new({ email: 'abc', password: '123' }))
    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      email: 'abc@peanuts.com',
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      email: {
        type: 'string',
      },
    })
  })

  context('CalendarDate and DateTime', () => {
    it('are converted to ISO strings', async () => {
      const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
        DreamSerializer(ModelForOpenapiTypeSpecs, data)
          .customAttribute('birthdate', () => data.birthdate, { openapi: 'date' })
          .customAttribute('aDatetime', () => data.aDatetime, { openapi: 'date-time' })
      const model = await fleshedOutModelForOpenapiTypeSpecs()
      const serializer = MySerializer(model)
      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer.render()).toEqual({
        birthdate: model.birthdate!.toISO(),
        aDatetime: model.aDatetime!.toISO(),
      })
    })
  })

  it('can override the OpenAPI shape with OpenAPI shorthand', async () => {
    const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
      DreamSerializer(ModelForOpenapiTypeSpecs, data).customAttribute(
        'birthdate',
        () => data.birthdate?.toDateTime(),
        { openapi: 'date-time' }
      )
    const model = await fleshedOutModelForOpenapiTypeSpecs()
    const serializer = MySerializer(model)
    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      birthdate: model.birthdate!.toDateTime()!.toISO(),
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      birthdate: {
        type: 'string',
        format: 'date-time',
      },
    })
  })

  it('can override the OpenAPI shape with an OpenAPI object', () => {
    const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
      DreamSerializer(ModelForOpenapiTypeSpecs, data).customAttribute(
        'volume',
        () => round(data.volume ?? 0),
        {
          openapi: {
            type: 'integer',
            format: undefined,
            description: 'Volume as an integer',
          },
        }
      )

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      volume: {
        type: 'integer',
        description: 'Volume as an integer',
      },
    })
  })

  context('with passthrough data', () => {
    it('when rendering a serializer directly, all passthrough data must be sent into the serializer', () => {
      const MySerializer = (data: User, passthroughData: { passthrough1?: string; passthrough2?: string }) =>
        DreamSerializer(User, data, passthroughData).customAttribute(
          'myString',
          () => `${passthroughData.passthrough1}, ${passthroughData.passthrough2}`,
          { openapi: 'string' }
        )

      const serializer = MySerializer(User.new({ email: 'abc', password: '123' }), {
        passthrough1: 'serializerP1',
        passthrough2: 'serializerP2',
      })

      const serializerRenderer = new SerializerRenderer(serializer, {
        passthrough1: 'rendererP1',
        passthrough2: 'rendererP2',
      })

      expect(serializerRenderer.render()).toEqual({
        myString: 'serializerP1, serializerP2',
      })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        myString: {
          type: 'string',
        },
      })
    })
  })

  context('when serializing null', () => {
    it('renders the attributes as null', () => {
      const MySerializer = (user: User | null) =>
        DreamSerializer(User, user).customAttribute('email', () => `${user!.email}@peanuts.com`, {
          openapi: 'string',
        })

      const serializer = MySerializer(null)
      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer.render()).toBeNull()

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        email: {
          type: 'string',
        },
      })
    })
  })

  context('flatten', () => {
    it('renders the serialized data into this model and adjusts the OpenAPI spec accordingly', () => {
      const birthdate = CalendarDate.fromISO('1950-10-02')
      const user = User.new({ id: '7', name: 'Charlie', birthdate })
      const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

      const MySerializer = (data: Pet) =>
        DreamSerializer(Pet, data)
          .attribute('species')
          .customAttribute(
            'user',
            () => {
              const serializer = UserSerializer(data.user!)
              return new SerializerRenderer(serializer).render()
            },
            {
              flatten: true,
              openapi: {
                $serializer: UserSerializer,
              },
            }
          )

      const serializer = MySerializer(pet)

      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer.render()).toEqual({
        species: 'dog',
        id: user.id,
        name: 'Charlie',
        favoriteWord: null,
        birthdate: birthdate.toISO(),
      })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      const results = serializerOpenapiRenderer.renderedOpenapi()
      expect(results.openapi).toEqual({
        allOf: [
          {
            type: 'object',
            required: ['species'],
            properties: {
              species: { type: ['string', 'null'], enum: SpeciesValues },
            },
          },
          {
            $ref: '#/components/schemas/User',
          },
        ],
      })

      expect(results.referencedSerializers).toHaveLength(1)
      expect((results.referencedSerializers[0] as any).globalName).toEqual('UserSerializer')
    })

    context('when optional and flatten', () => {
      it('the other association is wrapped in anyOf with null', () => {
        const birthdate = CalendarDate.fromISO('1950-10-02')
        const user = User.new({ id: '7', name: 'Charlie', birthdate })
        const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

        const MySerializer = (data: Pet) =>
          DreamSerializer(Pet, data)
            .attribute('species')
            .rendersOne('user', { flatten: true, optional: true })

        const serializer = MySerializer(pet)

        const serializerRenderer = new SerializerRenderer(serializer)
        expect(serializerRenderer.render()).toEqual({
          species: 'dog',
          id: user.id,
          name: 'Charlie',
          favoriteWord: null,
          birthdate: birthdate.toISO(),
        })

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
        const results = serializerOpenapiRenderer.renderedOpenapi()
        expect(results.openapi).toEqual({
          allOf: [
            {
              type: 'object',
              required: ['species'],
              properties: {
                species: { type: ['string', 'null'], enum: SpeciesValues },
              },
            },
            {
              anyOf: [
                {
                  $ref: '#/components/schemas/User',
                },
                {
                  type: 'null',
                },
              ],
            },
          ],
        })

        expect(results.referencedSerializers).toHaveLength(1)
        expect((results.referencedSerializers[0] as any).globalName).toEqual('UserSerializer')
      })
    })

    context('when the associated attributes are null', () => {
      it('renders the flattened attributes as null', () => {
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
          favoriteWord: null,
          birthdate: null,
        })
      })
    })

    context('when the associated attributes are undefined', () => {
      it('renders the flattened attributes as null', () => {
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
          favoriteWord: null,
          birthdate: null,
        })
      })
    })

    context('when the associated model is null', () => {
      it('renders the flattened attributes as null', () => {
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
          favoriteWord: null,
          birthdate: null,
        })
      })
    })
  })
})
