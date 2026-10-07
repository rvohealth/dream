import DreamSerializer from '../../../../src/serializer/DreamSerializer.js'
import ObjectSerializer from '../../../../src/serializer/ObjectSerializer.js'
import CalendarDate from '../../../../src/utils/datetime/CalendarDate.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import User from '../../../../test-app/app/models/User.js'
import UserViewModel from '../../../../test-app/app/view-models/UserViewModel.js'

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
    it('renders a present association unchanged (optional is an OpenAPI-only marker)', () => {
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
    it('spreads the rendered association attributes into the parent output', () => {
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

    context('when the parent declares a key the association also renders', () => {
      it('renders the association value when the parent declares the key earlier', () => {
        const user = User.new({ id: '7', name: 'Charlie' })
        const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

        const MySerializer = (data: Pet) =>
          DreamSerializer(Pet, data).attribute('id').attribute('name').rendersOne('user', { flatten: true })

        expect(MySerializer(pet).render()).toEqual({
          id: '7',
          name: 'Charlie',
          favoriteWord: null,
          birthdate: null,
        })
      })

      it('renders the parent value when the parent declares the key later', () => {
        const user = User.new({ id: '7', name: 'Charlie' })
        const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

        const MySerializer = (data: Pet) =>
          DreamSerializer(Pet, data).rendersOne('user', { flatten: true }).attribute('id').attribute('name')

        expect(MySerializer(pet).render()).toEqual({
          id: '3',
          name: 'Snoopy',
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

      it('renders null for a key the parent declares earlier', () => {
        const pet = Pet.new({ id: '3', user: null, name: 'Snoopy', species: 'dog' })

        const MySerializer = (data: Pet) =>
          DreamSerializer(Pet, data).attribute('id').rendersOne('user', { flatten: true })

        expect(MySerializer(pet).render()).toEqual({
          id: null,
          name: null,
          favoriteWord: null,
          birthdate: null,
        })
      })

      it('renders the parent value for a key the parent declares later', () => {
        const pet = Pet.new({ id: '3', user: null, name: 'Snoopy', species: 'dog' })

        const MySerializer = (data: Pet) =>
          DreamSerializer(Pet, data).rendersOne('user', { flatten: true }).attribute('id')

        expect(MySerializer(pet).render()).toEqual({
          id: '3',
          name: null,
          favoriteWord: null,
          birthdate: null,
        })
      })

      it('renders null for every key the viewModelClass serializer declares for a property that is not an association', () => {
        interface PetWithOwner {
          owner: UserViewModel | null
        }

        const pet = Pet.new({ id: '3', name: 'Snoopy', species: 'dog' })

        const MySerializer = (data: Pet) =>
          DreamSerializer(Pet, data)
            .attribute('species')
            .rendersOne<PetWithOwner>('owner', { viewModelClass: UserViewModel, flatten: true })

        expect(MySerializer(pet).render()).toEqual({
          species: 'dog',
          id: null,
          favoriteWord: null,
          name: null,
          birthdate: null,
        })
      })

      it('renders null for every key of a serializer that reads its data while being built', () => {
        const pet = Pet.new({ id: '3', user: null, name: 'Snoopy', species: 'dog' })

        const OwnerSerializer = (user: User) => {
          const serializer = DreamSerializer(User, user).attribute('id')
          return user.email ? serializer.attribute('email') : serializer.attribute('name')
        }

        const MySerializer = (data: Pet) =>
          DreamSerializer(Pet, data)
            .attribute('species')
            .rendersOne('user', { flatten: true, serializer: OwnerSerializer })

        expect(MySerializer(pet).render()).toEqual({ species: 'dog', id: null, name: null })
      })

      it('renders null for every key its serializer declares, without running the serializer callbacks', () => {
        const pet = Pet.new({ id: '3', user: null, name: 'Snoopy', species: 'dog' })

        const OwnerSerializer = (user: User) =>
          DreamSerializer(User, user)
            .attribute('id')
            .attribute('favoriteWord', { default: 'none' })
            .customAttribute('nameLength', () => user.name!.length, { openapi: 'integer' })
            .customAttribute('nameParts', () => ({ firstName: user.name!.split(' ')[0] }), {
              flatten: true,
              openapi: { type: 'object', properties: { firstName: { type: 'string' } } },
            })
            .delegatedAttribute('userSettings', 'likesChalupas', { openapi: 'boolean' })
            .rendersOne('featuredPost')
            .rendersMany('posts')
            .rendersOne('mainComposition', { flatten: true })

        const MySerializer = (data: Pet) =>
          DreamSerializer(Pet, data)
            .attribute('species')
            .rendersOne('user', { flatten: true, serializer: OwnerSerializer })

        expect(MySerializer(pet).render()).toEqual({
          species: 'dog',
          id: null,
          favoriteWord: null,
          nameLength: null,
          likesChalupas: null,
          featuredPost: null,
          posts: null,
          metadata: null,
          compositionAssets: null,
          passthroughCurrentLocalizedText: null,
        })
      })
    })
  })

  it('supports supplying a custom DreamSerializer', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = User.new({ id: '7', name: 'Charlie', birthdate })
    const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

    const CustomSerializer = (data: User) => DreamSerializer(User, data).attribute('name')
    const MySerializer = (data: Pet) =>
      DreamSerializer(Pet, data).rendersOne('user', { serializer: CustomSerializer })

    const serializer = MySerializer(pet)

    expect(serializer.render()).toEqual({
      user: {
        name: 'Charlie',
      },
    })
  })

  it('supports supplying a custom ObjectSerializer', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = User.new({ id: '7', name: 'Charlie', birthdate })
    const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

    const CustomSerializer = (data: User) => ObjectSerializer(data).attribute('name', { openapi: 'string' })
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

  context('with casing specified', () => {
    context('snake casing', () => {
      it('applies snake casing to nested serializer keys', () => {
        const birthdate = CalendarDate.fromISO('1950-10-02')
        const user = User.new({ id: '7', name: 'Charlie', birthdate })
        const pet = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })

        const MySerializer = (data: Pet) => DreamSerializer(Pet, data).rendersOne('user')

        const serializer = MySerializer(pet)

        expect(serializer.render({}, { casing: 'snake' })).toEqual({
          user: {
            id: user.id,
            name: 'Charlie',
            favorite_word: null,
            birthdate: birthdate.toISO(),
          },
        })
      })
    })
  })

  // type tests are all intentionally skipped. Instead, add @ts-expect-error
  // comments, which will become invalid if the type errors stop raising
  context('type tests', () => {
    it.skip('it prevents invalid arguments', () => {
      // @ts-expect-error this is a type test to ensure that invalid args raise
      DreamSerializer(Pet, Pet.new()).rendersOne('user', { as: 'abc', abc: 123 })
    })
  })
})
