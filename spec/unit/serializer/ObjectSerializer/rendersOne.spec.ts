import { CalendarDate, DreamSerializer, ObjectSerializer } from '../../../../src/index.js'
import { default as DreamUser } from '../../../../test-app/app/models/User.js'
import { Species, SpeciesValues } from '../../../../test-app/types/db.js'

interface SimpleUser {
  id: string
  name?: string
  birthdate?: CalendarDate
}

interface PetWithDreamUser {
  id: string
  name?: string
  user?: DreamUser
  species?: Species
}

interface PetWithSimpleUser {
  id: string
  name?: string
  user?: SimpleUser
  species?: Species
}

describe('ObjectSerializer rendersOne', () => {
  context('simple objects', () => {
    it('renders the associated objects using the provided serializer callback', () => {
      const birthdate = CalendarDate.fromISO('1950-10-02')
      const user: SimpleUser = { id: '7', name: 'Charlie', birthdate }
      const pet: PetWithSimpleUser = { id: '3', user, name: 'Snoopy', species: 'dog' }

      const UserSerializer = (data: SimpleUser) =>
        ObjectSerializer(data).attribute('name', { openapi: ['string', 'null'] })
      ;(UserSerializer as any)['globalName'] = 'CustomUserSerializer'
      ;(UserSerializer as any)['openapiName'] = 'CustomUser'
      const MySerializer = (data: PetWithSimpleUser) =>
        ObjectSerializer(data).rendersOne('user', { serializer: UserSerializer })

      const serializer = MySerializer(pet)

      expect(serializer.render()).toEqual({
        user: {
          name: 'Charlie',
        },
      })
    })
  })

  context('Dream model', () => {
    it('renders the Dream model’s default serializer', () => {
      const birthdate = CalendarDate.fromISO('1950-10-02')
      const user = DreamUser.new({ id: '7', name: 'Charlie', birthdate })
      const pet: PetWithDreamUser = { id: '3', user, name: 'Snoopy', species: 'dog' }

      const MySerializer = (data: PetWithDreamUser) =>
        ObjectSerializer(data).rendersOne('user', { dreamClass: DreamUser })

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

    it('supports specifying a specific serializerKey', () => {
      const birthdate = CalendarDate.fromISO('1950-10-02')
      const user = DreamUser.new({ id: '7', name: 'Charlie', birthdate, favoriteWord: 'hello' })
      const pet: PetWithDreamUser = { id: '3', user, name: 'Snoopy', species: 'dog' }

      const MySerializer = (data: PetWithDreamUser) =>
        ObjectSerializer(data).rendersOne('user', { dreamClass: DreamUser, serializerKey: 'summary' })

      const serializer = MySerializer(pet)

      expect(serializer.render()).toEqual({
        user: {
          id: user.id,
          favoriteWord: 'hello',
        },
      })
    })

    it('supports supplying a custom serializer', () => {
      const birthdate = CalendarDate.fromISO('1950-10-02')
      const user = DreamUser.new({ id: '7', name: 'Charlie', birthdate, favoriteWord: 'hello' })
      const pet: PetWithDreamUser = { id: '3', user, name: 'Snoopy', species: 'dog' }

      const CustomSerializer = (data: DreamUser) => DreamSerializer(DreamUser, data).attribute('name')
      ;(CustomSerializer as any)['globalName'] = 'CustomUserSerializer'
      ;(CustomSerializer as any)['openapiName'] = 'CustomUser'
      const MySerializer = (data: PetWithDreamUser) =>
        ObjectSerializer(data).rendersOne('user', { serializer: CustomSerializer })

      const serializer = MySerializer(pet)

      expect(serializer.render()).toEqual({
        user: {
          name: 'Charlie',
        },
      })
    })

    it("supports customizing the name of the thing rendered via { as: '...' } (replaces `source: string`)", () => {
      const birthdate = CalendarDate.fromISO('1950-10-02')
      const user = DreamUser.new({ id: '7', name: 'Charlie', birthdate, favoriteWord: 'hello' })
      const pet: PetWithDreamUser = { id: '3', user, name: 'Snoopy', species: 'dog' }

      const MySerializer = (data: PetWithDreamUser) =>
        ObjectSerializer(data).rendersOne('user', { dreamClass: DreamUser, as: 'user2' })

      const serializer = MySerializer(pet)

      expect(serializer.render()).toEqual({
        user2: {
          id: user.id,
          name: 'Charlie',
          favoriteWord: 'hello',
          birthdate: birthdate.toISO(),
        },
      })
    })

    context('flatten', () => {
      it('renders the serialized data into this model and adjusts the OpenAPI spec accordingly', () => {
        const birthdate = CalendarDate.fromISO('1950-10-02')
        const user = DreamUser.new({ id: '7', name: 'Charlie', birthdate, favoriteWord: 'hello' })
        const pet: PetWithDreamUser = { id: '3', user, name: 'Snoopy', species: 'dog' }

        const MySerializer = (data: PetWithDreamUser) =>
          ObjectSerializer(data)
            .attribute('species', { openapi: { type: ['string', 'null'], enum: SpeciesValues } })
            .rendersOne('user', { dreamClass: DreamUser, flatten: true })

        const serializer = MySerializer(pet)

        expect(serializer.render()).toEqual({
          species: 'dog',
          id: user.id,
          favoriteWord: 'hello',
          name: 'Charlie',
          birthdate: birthdate.toISO(),
        })
      })

      context('defined before a flattened attribute', () => {
        it('the attribute defined later in the serializer takes precedence', () => {
          const birthdate = CalendarDate.fromISO('1950-10-02')
          const user = DreamUser.new({ id: '7', name: 'Charlie', birthdate, favoriteWord: 'hello' })
          const pet: PetWithDreamUser = { id: '3', user, name: 'Snoopy', species: 'dog' }

          const MySerializer = (data: PetWithDreamUser) =>
            ObjectSerializer(data)
              .attribute('species', { openapi: { type: ['string', 'null'], enum: SpeciesValues } })
              // rendersOne generic param just to make sure it works
              .rendersOne<PetWithDreamUser>('user', { dreamClass: DreamUser, flatten: true })
              .customAttribute('favoriteWord', () => 'howdy', { openapi: 'string' })

          const serializer = MySerializer(pet)

          expect(serializer.render()).toEqual({
            species: 'dog',
            id: user.id,
            favoriteWord: 'howdy',
            name: 'Charlie',
            birthdate: birthdate.toISO(),
          })
        })
      })
    })
  })
})
