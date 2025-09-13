import { CalendarDate, DreamSerializer } from '../../../../src/index.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import User from '../../../../test-app/app/models/User.js'

describe('DreamSerializer#rendersOne', () => {
  it('renders the Dream model’s default serializer and includes the referenced serializer in the returned referencedSerializers array', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = User.new({ id: '7', name: 'Charlie', birthdate })
    const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

    const MySerializer = (data: Pet) => DreamSerializer(Pet, data).rendersOne('user')

    const serializer = MySerializer(pet)

    expect(serializer.render()).toEqual({
      user: {
        id: user.id,
        name: 'Charlie',
        favoriteWord: null,
        birthdate: birthdate.toISO(),
      },
    })
  })

  context('when there is no associated model', () => {
    it('renders null', () => {
      const pet = Pet.new({ id: '3', name: 'Snoopy', species: 'dog', user: null })

      const MySerializer = (data: Pet) => DreamSerializer(Pet, data).rendersOne('user')

      const serializer = MySerializer(pet)

      expect(serializer.render()).toEqual({
        user: null,
      })
    })
  })

  context('when optional', () => {
    it('the association is anyOf the ref or null', () => {
      const birthdate = CalendarDate.fromISO('1950-10-02')
      const user = User.new({ id: '7', name: 'Charlie', birthdate })
      const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

      const MySerializer = (data: Pet) => DreamSerializer(Pet, data).rendersOne('user', { optional: true })

      const serializer = MySerializer(pet)

      expect(serializer.render()).toEqual({
        user: {
          id: user.id,
          name: 'Charlie',
          favoriteWord: null,
          birthdate: birthdate.toISO(),
        },
      })
    })
  })

  context('when the associated attributes are null', () => {
    it('renders the flattened attributes as null', () => {
      const user = User.new({ id: '7', name: null, birthdate: null })
      const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

      const MySerializer = (data: Pet) => DreamSerializer(Pet, data).attribute('species').rendersOne('user')

      const serializer = MySerializer(pet)

      expect(serializer.render()).toEqual({
        species: 'dog',
        user: {
          id: user.id,
          name: null,
          favoriteWord: null,
          birthdate: null,
        },
      })
    })
  })

  context('when the associated attributes are undefined', () => {
    it('renders the flattened attributes as null', () => {
      const user = User.new({ id: '7' })
      const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

      const MySerializer = (data: Pet) => DreamSerializer(Pet, data).attribute('species').rendersOne('user')

      const serializer = MySerializer(pet)

      expect(serializer.render()).toEqual({
        species: 'dog',
        user: {
          id: user.id,
          name: null,
          favoriteWord: null,
          birthdate: null,
        },
      })
    })
  })

  context('when the associated model is null', () => {
    it('renders the flattened attributes as null', () => {
      const user = null
      const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

      const MySerializer = (data: Pet) => DreamSerializer(Pet, data).attribute('species').rendersOne('user')

      const serializer = MySerializer(pet)

      expect(serializer.render()).toEqual({
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

    expect(serializer.render()).toEqual({
      user: {
        id: user.id,
        favoriteWord: 'hello',
      },
    })
  })

  it("supports customizing the name of the thing rendered via { as: '...' } (replaces `source: string`)", () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = User.new({ id: '7', name: 'Charlie', birthdate })
    const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

    const MySerializer = (data: Pet) => DreamSerializer(Pet, data).rendersOne('user', { as: 'user2' })

    const serializer = MySerializer(pet)

    expect(serializer.render()).toEqual({
      user2: {
        id: user.id,
        name: 'Charlie',
        favoriteWord: null,
        birthdate: birthdate.toISO(),
      },
    })
  })

  context('flatten', () => {
    it('renders the serialized data into this model and adjusts the OpenAPI spec accordingly', () => {
      const birthdate = CalendarDate.fromISO('1950-10-02')
      const user = User.new({ id: '7', name: 'Charlie', birthdate })
      const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

      const MySerializer = (data: Pet) =>
        DreamSerializer(Pet, data).attribute('species').rendersOne('user', { flatten: true })

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

  it('supports supplying a custom serializer', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = User.new({ id: '7', name: 'Charlie', birthdate })
    const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

    const CustomSerializer = (data: User) => DreamSerializer(User, data).attribute('name')
    ;(CustomSerializer as any)['globalName'] = 'CustomUserSerializer'
    ;(CustomSerializer as any)['openapiName'] = 'CustomUser'
    const MySerializer = (data: Pet) =>
      DreamSerializer(Pet, data).rendersOne('user', { serializer: CustomSerializer })

    const serializer = MySerializer(pet)

    expect(serializer.render()).toEqual({
      user: {
        name: 'Charlie',
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
        () => `${passthroughData.locale}-${data.name}`,
        { openapi: 'string' }
      )
    ;(CustomSerializer as any)['globalName'] = 'CustomUserSerializer'
    ;(CustomSerializer as any)['openapiName'] = 'CustomUser'
    const MySerializer = (data: Pet) =>
      DreamSerializer(Pet, data).rendersOne('user', { serializer: CustomSerializer })

    const serializer = MySerializer(pet)

    expect(serializer.render({ locale: 'en-US' })).toEqual({
      user: {
        title: 'en-US-Charlie',
      },
    })
  })
})
