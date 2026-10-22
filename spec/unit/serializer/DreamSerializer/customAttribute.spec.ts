import DreamSerializer from '../../../../src/serializer/DreamSerializer.js'
import CalendarDate from '../../../../src/utils/datetime/CalendarDate.js'
import ModelForOpenapiTypeSpecs from '../../../../test-app/app/models/ModelForOpenapiTypeSpec.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import User from '../../../../test-app/app/models/User.js'
import UserSerializer from '../../../../test-app/app/serializers/UserSerializer.js'
import fleshedOutModelForOpenapiTypeSpecs from '../../../scaffold/fleshedOutModelForOpenapiTypeSpecs.js'

describe('DreamSerializer#customAttribute', () => {
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
      birthdate: model.birthdate!.toDateTime().toISO(),
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
    it('spreads the rendered serializer output it returns into the parent output', () => {
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

    it('spreads the keys of a returned plain object into the parent output', () => {
      const pet = Pet.new({ id: '3', name: 'Snoopy', species: 'dog' })

      const MySerializer = (data: Pet) =>
        DreamSerializer(Pet, data)
          .attribute('species')
          .customAttribute('coordinates', () => ({ lat: 40.7, lng: -74.0 }), {
            flatten: true,
            openapi: {
              type: 'object',
              required: ['lat', 'lng'],
              properties: {
                lat: { type: 'number' },
                lng: { type: 'number' },
              },
            },
          })

      expect(MySerializer(pet).render()).toEqual({ species: 'dog', lat: 40.7, lng: -74.0 })
    })

    it('renders no key its openapi leaves optional when the callback returns null or undefined', () => {
      const pet = Pet.new({ id: '3', name: 'Snoopy', species: 'dog' })
      const openapi = {
        type: 'object',
        properties: { lat: { type: 'number' }, lng: { type: 'number' } },
      } as const

      const MySerializer = (data: Pet) =>
        DreamSerializer(Pet, data)
          .attribute('species')
          .customAttribute('nullCoordinates', () => null, { flatten: true, openapi })
          .customAttribute('undefinedCoordinates', () => undefined, { flatten: true, openapi })

      expect(MySerializer(pet).render()).toEqual({ species: 'dog' })
    })

    it('renders null for each key its openapi `required` array lists when the callback returns null or undefined, leaving the others absent', () => {
      const pet = Pet.new({ id: '3', name: 'Snoopy', species: 'dog' })
      const openapi = {
        type: 'object' as const,
        properties: {
          lat: { type: 'number' as const },
          lng: { type: 'number' as const },
          altitude: { type: 'number' as const },
        },
        required: ['lat', 'lng'],
      }

      const NullSerializer = (data: Pet) =>
        DreamSerializer(Pet, data)
          .attribute('species')
          .customAttribute('coordinates', () => null, { flatten: true, openapi })
      const UndefinedSerializer = (data: Pet) =>
        DreamSerializer(Pet, data)
          .attribute('species')
          .customAttribute('coordinates', () => undefined, { flatten: true, openapi })

      expect(NullSerializer(pet).render()).toEqual({ species: 'dog', lat: null, lng: null })
      expect(UndefinedSerializer(pet).render()).toEqual({ species: 'dog', lat: null, lng: null })
    })

    context('when optional and flatten', () => {
      it('spreads a present association unchanged (optional is an OpenAPI-only marker)', () => {
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

  // type tests are all intentionally skipped. Instead, add @ts-expect-error
  // comments, which will become invalid if the type errors stop raising
  context('type tests', () => {
    it.skip('takes no as, default or precision, since the callback computes the value', () => {
      const pet = Pet.new()

      DreamSerializer(Pet, pet).customAttribute('name', () => 'value', {
        openapi: 'string',
        // @ts-expect-error the attribute is named by its first argument
        as: 'other',
      })
      DreamSerializer(Pet, pet).customAttribute('name', () => undefined, {
        openapi: 'string',
        // @ts-expect-error any fallback belongs in the callback
        default: 'fallback',
      })
      DreamSerializer(Pet, pet).customAttribute('rating', () => 3.14159, {
        openapi: 'decimal',
        // @ts-expect-error any rounding belongs in the callback
        precision: 2,
      })
    })

    it.skip('a nullable schema lists a null branch in its anyOf or oneOf rather than a nullable type beside it', () => {
      const pet = Pet.new()

      DreamSerializer(Pet, pet).customAttribute('owner', () => null, {
        openapi: { description: 'who owns it', anyOf: [{ $serializer: UserSerializer }, { type: 'null' }] },
      })
      DreamSerializer(Pet, pet).customAttribute('owner', () => null, {
        openapi: { oneOf: [{ type: 'object', properties: { name: 'string' } }, { type: 'null' }] },
      })
      DreamSerializer(Pet, pet).customAttribute('owner', () => null, {
        openapi: { type: 'object', allOf: [{ $serializer: UserSerializer }] },
      })

      DreamSerializer(Pet, pet).customAttribute('owner', () => null, {
        // @ts-expect-error anyOf applies to null too, so a nullable type beside it cannot admit null
        openapi: { type: ['object', 'null'], anyOf: [{ $serializer: UserSerializer }] },
      })
      DreamSerializer(Pet, pet).customAttribute('owner', () => null, {
        // @ts-expect-error a type beside oneOf is not allowed
        openapi: { type: 'object', oneOf: [{ $serializer: UserSerializer }] },
      })
      DreamSerializer(Pet, pet).customAttribute('name', () => null, {
        // @ts-expect-error a type beside anyOf is not allowed
        openapi: { type: 'string', anyOf: [{ type: 'string' }, { type: 'null' }] },
      })
      DreamSerializer(Pet, pet).customAttribute('owner', () => null, {
        // @ts-expect-error allOf applies to null too, so a nullable type beside it cannot admit null
        openapi: { type: ['object', 'null'], allOf: [{ $serializer: UserSerializer }] },
      })
    })

    it.skip('an allOf carries neither an object body nor a primitive type beside it', () => {
      const pet = Pet.new()

      DreamSerializer(Pet, pet).customAttribute('owner', () => null, {
        openapi: { type: 'object', required: ['name'], allOf: [{ $serializer: UserSerializer }] },
      })

      DreamSerializer(Pet, pet).customAttribute('owner', () => null, {
        // @ts-expect-error an object body beside allOf is not rendered; put it in an allOf member
        openapi: { type: 'object', properties: { name: 'string' }, allOf: [{ type: 'object' }] },
      })
      DreamSerializer(Pet, pet).customAttribute('name', () => null, {
        // @ts-expect-error a primitive type beside allOf is not allowed
        openapi: { type: 'string', allOf: [{ type: 'string' }] },
      })
    })

    it.skip('a flattened serializer ref may be nullable but not a list', () => {
      const pet = Pet.new()

      DreamSerializer(Pet, pet).customAttribute('user', () => null, {
        flatten: true,
        openapi: { $serializer: UserSerializer, maybeNull: true },
      })

      DreamSerializer(Pet, pet).customAttribute('users', () => [], {
        openapi: { $serializer: UserSerializer, many: true },
      })

      // @ts-expect-error a list has no properties to spread into the parent
      DreamSerializer(Pet, pet).customAttribute('users', () => [], {
        flatten: true,
        openapi: { $serializer: UserSerializer, many: true },
      })

      // @ts-expect-error a list has no properties to spread into the parent
      DreamSerializer(Pet, pet).customAttribute('users', () => [], {
        flatten: true,
        openapi: { $serializable: User, many: true },
      })
    })
  })
})
