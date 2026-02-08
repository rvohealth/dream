import ObjectSerializer from '../../../../src/serializer/ObjectSerializer.js'
import CalendarDate from '../../../../src/utils/datetime/CalendarDate.js'
import { default as DreamPet } from '../../../../test-app/app/models/Pet.js'
import { CatTreats, Species } from '../../../../test-app/types/db.js'

interface UserWithSimplePets {
  id: string
  name?: string
  birthdate?: CalendarDate
  pets: SimplePet[]
}

interface UserWithDreamPets {
  id: string
  name?: string
  birthdate?: CalendarDate
  pets: DreamPet[]
}

interface SimplePet {
  id: string
  name?: string
  species?: Species
  ratings?: any[]
  favoriteTreats?: CatTreats[]
}

describe('ObjectSerializer#rendersMany', () => {
  context('simple objects', () => {
    it('renders the associated objects using the provided serializer callback', () => {
      const birthdate = CalendarDate.fromISO('1950-10-02')
      const pet1: SimplePet = { id: '3', name: 'Snoopy', species: 'dog', ratings: [] }
      const pet2: SimplePet = { id: '7', name: 'Woodstock', species: 'frog', ratings: [] }
      const user: UserWithSimplePets = { id: '11', name: 'Charlie', birthdate, pets: [pet1, pet2] }

      const PetSerializer = (data: SimplePet) =>
        ObjectSerializer(data).attribute('name', { openapi: ['string', 'null'] })
      ;(PetSerializer as any)['globalName'] = 'PetSerializer'
      ;(PetSerializer as any)['openapiName'] = 'Pet'
      const MySerializer = (data: UserWithSimplePets) =>
        ObjectSerializer(data).rendersMany('pets', { serializer: PetSerializer })

      const serializer = MySerializer(user)

      expect(serializer.render()).toEqual({
        pets: [
          {
            name: 'Snoopy',
          },
          {
            name: 'Woodstock',
          },
        ],
      })
    })
  })

  context('Dream models', () => {
    it('renders the associated objects using the default serializer for the Dream model', () => {
      const birthdate = CalendarDate.fromISO('1950-10-02')
      const pet1: DreamPet = DreamPet.new({ id: '3', name: 'Snoopy', species: 'dog' })
      const pet2: DreamPet = DreamPet.new({ id: '7', name: 'Woodstock', species: 'frog' })
      pet1.ratings = []
      pet2.ratings = []
      const user: UserWithDreamPets = { id: '11', name: 'Charlie', birthdate, pets: [pet1, pet2] }

      const MySerializer = (data: UserWithDreamPets) =>
        ObjectSerializer(data).rendersMany('pets', { dreamClass: DreamPet })

      const serializer = MySerializer(user)

      expect(serializer.render()).toEqual({
        pets: [
          {
            id: pet1.id,
            name: 'Snoopy',
            favoriteDaysOfWeek: ['Monday', 'Tuesday'],
            species: 'dog',
            ratings: [],
          },
          {
            id: pet2.id,
            name: 'Woodstock',
            favoriteDaysOfWeek: ['Monday', 'Tuesday'],
            species: 'frog',
            ratings: [],
          },
        ],
      })
    })

    it('supports rendering a Dream model with a custom serializerKey', () => {
      const birthdate = CalendarDate.fromISO('1950-10-02')
      const pet1: DreamPet = DreamPet.new({
        id: '3',
        name: 'Snoopy',
        species: 'dog',
        favoriteTreats: ['chicken'],
      })
      const pet2: DreamPet = DreamPet.new({
        id: '7',
        name: 'Woodstock',
        species: 'frog',
        favoriteTreats: ['ocean fish'],
      })
      pet1.ratings = []
      pet2.ratings = []
      const user: UserWithDreamPets = { id: '11', name: 'Charlie', birthdate, pets: [pet1, pet2] }

      const MySerializer = (data: UserWithDreamPets) =>
        ObjectSerializer(data).rendersMany('pets', { dreamClass: DreamPet, serializerKey: 'summary' })

      const serializer = MySerializer(user)

      expect(serializer.render()).toEqual({
        pets: [
          {
            id: pet1.id,
            favoriteTreats: ['chicken'],
          },
          {
            id: pet2.id,
            favoriteTreats: ['ocean fish'],
          },
        ],
      })
    })

    it("supports customizing the name of the thing rendered via { as: '...' } (replaces `source: string`)", () => {
      const birthdate = CalendarDate.fromISO('1950-10-02')
      const pet1: DreamPet = DreamPet.new({ id: '3', name: 'Snoopy', species: 'dog' })
      const pet2: DreamPet = DreamPet.new({ id: '7', name: 'Woodstock', species: 'frog' })
      pet1.ratings = []
      pet2.ratings = []
      const user: UserWithDreamPets = { id: '11', name: 'Charlie', birthdate, pets: [pet1, pet2] }

      const MySerializer = (data: UserWithDreamPets) =>
        ObjectSerializer(data).rendersMany('pets', { dreamClass: DreamPet, as: 'pets2' })

      const serializer = MySerializer(user)

      expect(serializer.render()).toEqual({
        pets2: [
          {
            id: pet1.id,
            name: 'Snoopy',
            favoriteDaysOfWeek: ['Monday', 'Tuesday'],
            species: 'dog',
            ratings: [],
          },
          {
            id: pet2.id,
            name: 'Woodstock',
            favoriteDaysOfWeek: ['Monday', 'Tuesday'],
            species: 'frog',
            ratings: [],
          },
        ],
      })
    })

    it('supports supplying a custom serializer', () => {
      const birthdate = CalendarDate.fromISO('1950-10-02')
      const pet1: SimplePet = { id: '3', name: 'Snoopy', species: 'dog' }
      const pet2: SimplePet = { id: '7', name: 'Woodstock', species: 'frog' }
      pet1.ratings = []
      pet2.ratings = []
      const user: UserWithSimplePets = { id: '11', name: 'Charlie', birthdate, pets: [pet1, pet2] }

      const CustomSerializer = (data: SimplePet) =>
        ObjectSerializer(data).attribute('name', { openapi: ['string', 'null'] })
      ;(CustomSerializer as any)['globalName'] = 'CustomPetSerializer'
      ;(CustomSerializer as any)['openapiName'] = 'CustomPet'
      const MySerializer = (data: UserWithSimplePets) =>
        // rendersMany generic param just to make sure it works
        ObjectSerializer(data).rendersMany<UserWithSimplePets>('pets', { serializer: CustomSerializer })

      const serializer = MySerializer(user)

      expect(serializer.render()).toEqual({
        pets: [
          {
            name: 'Snoopy',
          },
          {
            name: 'Woodstock',
          },
        ],
      })
    })
  })
})
