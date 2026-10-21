import DreamSerializer from '../../../../src/serializer/DreamSerializer.js'
import ObjectSerializer from '../../../../src/serializer/ObjectSerializer.js'
import CalendarDate from '../../../../src/utils/datetime/CalendarDate.js'
import Balloon from '../../../../test-app/app/models/Balloon.js'
import PolymorphicTask from '../../../../test-app/app/models/Polymorphic/Task.js'
import { default as DreamUser } from '../../../../test-app/app/models/User.js'
import { PolymorphicTaskSerializer } from '../../../../test-app/app/serializers/Polymorphic/TaskSerializer.js'
import UserSerializer from '../../../../test-app/app/serializers/UserSerializer.js'
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

describe('ObjectSerializer#rendersOne', () => {
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

    context('flatten, when the associated object is null', () => {
      it('renders null for every key the serializer declares, without running the serializer callbacks', () => {
        interface Toy {
          name: string
        }

        interface Owner {
          id: string
          name: string
          settings: { theme: string }
          favoriteToy: Toy
          bestToy: Toy
          toys: Toy[]
        }

        interface PetWithOwner {
          id: string
          owner: Owner | null
        }

        const ToySerializer = (toy: Toy) =>
          ObjectSerializer(toy).attribute('name', { as: 'toyName', openapi: 'string' })

        const OwnerSerializer = (owner: Owner) =>
          ObjectSerializer(owner)
            .attribute('id', { openapi: 'string' })
            .attribute('name', { default: 'unknown', openapi: 'string' })
            .customAttribute('nameLength', () => owner.name.length, { openapi: 'integer' })
            .delegatedAttribute('settings', 'theme', { openapi: 'string' })
            .rendersOne('favoriteToy', { serializer: ToySerializer })
            .rendersMany('toys', { serializer: ToySerializer })
            .rendersOne('bestToy', { serializer: ToySerializer, flatten: true })

        const MySerializer = (data: PetWithOwner) =>
          ObjectSerializer(data)
            .attribute('id', { openapi: 'string' })
            .rendersOne('owner', { serializer: OwnerSerializer, flatten: true })

        expect(MySerializer({ id: '3', owner: null }).render()).toEqual({
          id: null,
          name: null,
          nameLength: null,
          theme: null,
          favoriteToy: null,
          toys: null,
          toyName: null,
        })
      })

      context('with a flattened customAttribute', () => {
        interface Address {
          city: string
        }

        interface Contact {
          email: string
          address: Address
        }

        interface PetWithContact {
          species: string
          contact: Contact | null
        }

        const AddressSerializer = (address: Address) =>
          ObjectSerializer(address).attribute('city', { openapi: 'string' })

        it('renders null for every key of its openapi properties', () => {
          const ContactSerializer = (contact: Contact) =>
            ObjectSerializer(contact)
              .attribute('email', { openapi: 'string' })
              .rendersOne('address', { serializer: AddressSerializer, flatten: true })
              .customAttribute('phone', () => ({ phoneNumber: '555-1234' }), {
                flatten: true,
                openapi: { type: 'object', properties: { phoneNumber: 'string' } },
              })

          const PetSerializer = (pet: PetWithContact) =>
            ObjectSerializer(pet)
              .attribute('species', { openapi: 'string' })
              .rendersOne('contact', { serializer: ContactSerializer, flatten: true })

          expect(PetSerializer({ species: 'cat', contact: null }).render()).toEqual({
            species: 'cat',
            email: null,
            city: null,
            phoneNumber: null,
          })

          expect(PetSerializer({ species: 'cat', contact: null }).render({}, { casing: 'snake' })).toEqual({
            species: 'cat',
            email: null,
            city: null,
            phone_number: null,
          })
        })

        it('renders null for every key of a $serializer ref’s serializer, and none for a many ref', () => {
          const NeighborSerializer = (neighbor: { name: string }) =>
            ObjectSerializer(neighbor).attribute('name', { openapi: 'string' })

          const ContactSerializer = (contact: Contact) =>
            ObjectSerializer(contact)
              .attribute('email', { openapi: 'string' })
              .customAttribute('address', () => AddressSerializer(contact.address), {
                flatten: true,
                openapi: { $serializer: AddressSerializer },
              })
              .customAttribute('neighbors', () => null, {
                flatten: true,
                openapi: { anyOf: [{ $serializer: NeighborSerializer, many: true }, { type: 'null' }] },
              })

          const PetSerializer = (pet: PetWithContact) =>
            ObjectSerializer(pet)
              .attribute('species', { openapi: 'string' })
              .rendersOne('contact', { serializer: ContactSerializer, flatten: true })

          expect(PetSerializer({ species: 'cat', contact: null }).render()).toEqual({
            species: 'cat',
            email: null,
            city: null,
          })
        })

        it('renders null for every key of every STI child serializer a $serializable ref resolves to', () => {
          const ContactSerializer = (contact: Contact) =>
            ObjectSerializer(contact)
              .attribute('email', { openapi: 'string' })
              .customAttribute('balloon', () => null, {
                flatten: true,
                openapi: { $serializable: Balloon, key: 'stiUnion' },
              })

          const PetSerializer = (pet: PetWithContact) =>
            ObjectSerializer(pet)
              .attribute('species', { openapi: 'string' })
              .rendersOne('contact', { serializer: ContactSerializer, flatten: true })

          expect(PetSerializer({ species: 'cat', contact: null }).render()).toEqual({
            species: 'cat',
            email: null,
            color: null,
            multicolor: null,
            mylarOnlyProperty: null,
            sandbags: null,
            heartRatings: null,
            material: null,
            balloonLine: null,
          })
        })

        it('renders null for the union of the keys of every member of an anyOf, oneOf or allOf', () => {
          const ContactSerializer = (contact: Contact) =>
            ObjectSerializer(contact)
              .attribute('email', { openapi: 'string' })
              .customAttribute('details', () => null, {
                flatten: true,
                openapi: {
                  anyOf: [
                    { type: 'object', properties: { phoneNumber: 'string' } },
                    { $serializer: AddressSerializer },
                    {
                      oneOf: [
                        { type: 'object', properties: { fax: 'string' } },
                        { allOf: [{ type: 'object', properties: { pager: 'string' } }] },
                      ],
                    },
                    { type: 'null' },
                  ],
                },
              })

          const PetSerializer = (pet: PetWithContact) =>
            ObjectSerializer(pet)
              .attribute('species', { openapi: 'string' })
              .rendersOne('contact', { serializer: ContactSerializer, flatten: true })

          expect(PetSerializer({ species: 'cat', contact: null }).render()).toEqual({
            species: 'cat',
            email: null,
            phoneNumber: null,
            city: null,
            fax: null,
            pager: null,
          })
        })
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

    it('supports supplying a custom DreamSerializer', () => {
      const birthdate = CalendarDate.fromISO('1950-10-02')
      const user = DreamUser.new({ id: '7', name: 'Charlie', birthdate, favoriteWord: 'hello' })
      const pet: PetWithDreamUser = { id: '3', user, name: 'Snoopy', species: 'dog' }

      const MySerializer = (data: PetWithDreamUser) =>
        ObjectSerializer(data).rendersOne('user', { serializer: UserSerializer })

      const serializer = MySerializer(pet)

      expect(serializer.render()).toEqual({
        user: {
          birthdate: '1950-10-02',
          favoriteWord: 'hello',
          id: '7',
          name: 'Charlie',
        },
      })
    })

    it('supports supplying a custom ObjectSerializer', () => {
      const birthdate = CalendarDate.fromISO('1950-10-02')
      const user = DreamUser.new({ id: '7', name: 'Charlie', birthdate, favoriteWord: 'hello' })
      const pet: PetWithDreamUser = { id: '3', user, name: 'Snoopy', species: 'dog' }

      const CustomSerializer = (data: DreamUser) => DreamSerializer(DreamUser, data).attribute('name')
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

    context('with casing specified', () => {
      context('snake casing', () => {
        it('applies snake casing to nested serializer keys', () => {
          const birthdate = CalendarDate.fromISO('1950-10-02')
          const user = DreamUser.new({ id: '7', name: 'Charlie', birthdate })
          const pet: PetWithDreamUser = { id: '3', user, name: 'Snoopy', species: 'dog' }

          const MySerializer = (data: PetWithDreamUser) =>
            ObjectSerializer(data).rendersOne('user', { dreamClass: DreamUser })

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

      context('when the associated object is null', () => {
        it('renders null for every key the dreamClass serializer declares', () => {
          const pet: PetWithDreamUser = { id: '3', name: 'Snoopy', species: 'dog' }

          const MySerializer = (data: PetWithDreamUser) =>
            ObjectSerializer(data)
              .attribute('species', { openapi: { type: ['string', 'null'], enum: SpeciesValues } })
              .rendersOne('user', { dreamClass: DreamUser, flatten: true })

          expect(MySerializer(pet).render()).toEqual({
            species: 'dog',
            id: null,
            favoriteWord: null,
            name: null,
            birthdate: null,
          })
        })

        it('renders null for every key the serializer of any STI child of the dreamClass declares', () => {
          interface CollarWithBalloon {
            tagName: string
            balloon: Balloon | null
          }

          const MySerializer = (data: CollarWithBalloon) =>
            ObjectSerializer(data)
              .attribute('tagName', { openapi: 'string' })
              .rendersOne('balloon', { dreamClass: Balloon, flatten: true })

          // Balloon's STI children sort Animal, Latex, Mylar, and only Mylar's default serializer
          // renders `mylarOnlyProperty`
          expect(MySerializer({ tagName: 'Spot', balloon: null }).render()).toEqual({
            tagName: 'Spot',
            color: null,
            mylarOnlyProperty: null,
          })
        })

        it('renders null for every key the serializer of any polymorphic belongs-to target declares, when the serializer flattens that association', () => {
          interface TaskHolder {
            id: number
            task: PolymorphicTask | null
          }

          const MySerializer = (data: TaskHolder) =>
            ObjectSerializer(data)
              .attribute('id', { openapi: 'integer' })
              .rendersOne('task', { flatten: true, serializer: PolymorphicTaskSerializer })

          expect(MySerializer({ id: 5, task: null }).render()).toEqual({
            id: 5,
            name: null,
            cleaningSupplies: null,
            workoutType: null,
          })
        })
      })
    })
  })
})
