import { CalendarDate } from '../../../../src/index.js'
import DreamSerializer from '../../../../src/serializer/DreamSerializer.js'
import ModelForOpenapiTypeSpecs from '../../../../test-app/app/models/ModelForOpenapiTypeSpec.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import User from '../../../../test-app/app/models/User.js'
import UserSerializer from '../../../../test-app/app/serializers/UserSerializer.js'
import fleshedOutModelForOpenapiTypeSpecs from '../../../scaffold/fleshedOutModelForOpenapiTypeSpecs.js'

describe('DreamSerializer customAttributes', () => {
  it('can render the results of calling the callback function', () => {
    const MySerializer = (user: User) =>
      DreamSerializer(User, user).customAttribute('email', () => `${user.email}@peanuts.com`, {
        openapi: 'string',
      })

    const serializer = MySerializer(User.new({ email: 'abc', password: '123' }))
    expect(serializer.render()).toEqual({
      email: 'abc@peanuts.com',
    })
  })

  context('returning a serializer', () => {
    it('automatically renders the serializer', async () => {
      const OtherSerializer = (data: ModelForOpenapiTypeSpecs) =>
        DreamSerializer(ModelForOpenapiTypeSpecs, data).attribute('name', { as: 'myName' })

      const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
        DreamSerializer(ModelForOpenapiTypeSpecs, data).customAttribute(
          'otherSerializer',
          () => OtherSerializer(data),
          { openapi: { $serializer: OtherSerializer } }
        )

      const model = await fleshedOutModelForOpenapiTypeSpecs()
      const serializer = MySerializer(model)
      expect(serializer.render()).toEqual({
        otherSerializer: { myName: 'Charles Brown' },
      })
    })

    context('with casing specified', () => {
      it('renders the returned serializer with the specified casing', async () => {
        const OtherSerializer = (data: ModelForOpenapiTypeSpecs) =>
          DreamSerializer(ModelForOpenapiTypeSpecs, data).attribute('name', { as: 'myName' })

        const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
          DreamSerializer(ModelForOpenapiTypeSpecs, data).customAttribute(
            'otherSerializer',
            () => OtherSerializer(data),
            { openapi: { $serializer: OtherSerializer } }
          )

        const model = await fleshedOutModelForOpenapiTypeSpecs()
        const serializer = MySerializer(model)
        expect(serializer.render({}, { casing: 'snake' })).toEqual({
          other_serializer: { my_name: 'Charles Brown' },
        })
      })
    })
  })

  context('returning an array of serializers', () => {
    it('automatically renders the serializers', async () => {
      const OtherSerializer = (data: ModelForOpenapiTypeSpecs) =>
        DreamSerializer(ModelForOpenapiTypeSpecs, data).attribute('name', { as: 'myName' })

      const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
        DreamSerializer(ModelForOpenapiTypeSpecs, data).customAttribute(
          'otherSerializers',
          () => [OtherSerializer(data)],
          { openapi: { type: 'array', items: { $serializer: OtherSerializer } } }
        )

      const model = await fleshedOutModelForOpenapiTypeSpecs()
      const serializer = MySerializer(model)
      expect(serializer.render()).toEqual({
        otherSerializers: [{ myName: 'Charles Brown' }],
      })
    })

    context('with casing specified', () => {
      it('renders the returned serializer with the specified casing', async () => {
        const OtherSerializer = (data: ModelForOpenapiTypeSpecs) =>
          DreamSerializer(ModelForOpenapiTypeSpecs, data).attribute('name', { as: 'myName' })

        const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
          DreamSerializer(ModelForOpenapiTypeSpecs, data).customAttribute(
            'otherSerializers',
            () => [OtherSerializer(data)],
            { openapi: { type: 'array', items: { $serializer: OtherSerializer } } }
          )

        const model = await fleshedOutModelForOpenapiTypeSpecs()
        const serializer = MySerializer(model)
        expect(serializer.render({}, { casing: 'snake' })).toEqual({
          other_serializers: [{ my_name: 'Charles Brown' }],
        })
      })
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
      expect(serializer.render()).toEqual({
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
    expect(serializer.render()).toEqual({
      birthdate: model.birthdate!.toDateTime()!.toISO(),
    })
  })

  context('with passthrough data', () => {
    it('when rendering a serializer directly, all passthrough data must be sent into the serializer, not into the render call', () => {
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

      expect(serializer.render({ passthrough1: 'rendererP1', passthrough2: 'rendererP2' })).toEqual({
        myString: 'serializerP1, serializerP2',
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
      expect(serializer.render()).toBeNull()
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
              return serializer.render()
            },
            {
              flatten: true,
              openapi: {
                $serializer: UserSerializer,
              },
            }
          )

      const serializer = MySerializer(pet)

      expect(serializer.render()).toEqual({
        species: 'dog',
        id: user.id,
        name: 'Charlie',
        favoriteWord: null,
        birthdate: birthdate.toISO(),
      })
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

        expect(serializer.render()).toEqual({
          species: 'dog',
          id: user.id,
          name: 'Charlie',
          favoriteWord: null,
          birthdate: birthdate.toISO(),
        })
      })
    })

    context('when the associated attributes are null', () => {
      it('renders the flattened attributes as null', () => {
        const user = User.new({ id: '7', name: null, birthdate: null })
        const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

        const MySerializer = (data: Pet) =>
          DreamSerializer(Pet, data).attribute('species').rendersOne('user', { flatten: true })

        const serializer = MySerializer(pet)

        expect(serializer.render()).toEqual({
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

        expect(serializer.render()).toEqual({
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

        expect(serializer.render()).toEqual({
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
