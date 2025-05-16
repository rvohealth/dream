import { CalendarDate, SimpleObjectSerializer } from '../../../../src/index.js'
import SerializerOpenapiRenderer from '../../../../src/serializer/SerializerOpenapiRenderer.js'
import SerializerRenderer from '../../../../src/serializer/SerializerRenderer.js'
import { default as DreamPet } from '../../../../test-app/app/models/Pet.js'
import { CatTreats, Species } from '../../../../test-app/types/db.js'

interface User {
  id: string
  name?: string
  birthdate?: CalendarDate
  pets: Pet[]
}

interface Pet {
  id: string
  name?: string
  user?: User
  species?: Species
  ratings?: any[]
  favoriteTreats?: CatTreats[]
}

describe('SimpleObjectSerializer rendersMany', () => {
  it.only('renders the associated objects', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const pet1: Pet = { id: '3', name: 'Snoopy', species: 'dog', ratings: [] }
    const pet2: Pet = { id: '7', name: 'Woodstock', species: 'frog', ratings: [] }
    const user: User = { id: '11', name: 'Charlie', birthdate, pets: [pet1, pet2] }

    const PetSerializer = ($data: Pet) => SimpleObjectSerializer($data).attribute('name')
    const MySerializer = ($data: User) =>
      SimpleObjectSerializer($data).rendersMany('pets', { serializer: () => PetSerializer })

    const serializer = MySerializer(user)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
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

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      pets: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/PetSerializer',
        },
      },
    })
  })

  // it('supports specifying the serializerKey', () => {
  //   const birthdate = CalendarDate.fromISO('1950-10-02')
  //   const pet1: Pet = { id: '3', name: 'Snoopy', species: 'dog', favoriteTreats: ['chicken'] }
  //   const pet2: Pet = {
  //     id: '7',
  //     name: 'Woodstock',
  //     species: 'frog',
  //     favoriteTreats: ['ocean fish'],
  //   }
  //   pet1.ratings = []
  //   pet2.ratings = []
  //   const user: User = { id: '11', name: 'Charlie', birthdate, pets: [pet1, pet2] }

  //   const MySerializer = ($data: User) =>
  //     SimpleObjectSerializer($data).rendersMany('pets', { serializerKey: 'summary' })

  //   const serializer = MySerializer(user)

  //   const serializerRenderer = new SerializerRenderer(serializer)
  //   expect(serializerRenderer.render()).toEqual({
  //     pets: [
  //       {
  //         id: pet1.id,
  //         favoriteTreats: ['chicken'],
  //       },
  //       {
  //         id: pet2.id,
  //         favoriteTreats: ['ocean fish'],
  //       },
  //     ],
  //   })

  //   const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
  //   expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
  //     pets: {
  //       type: 'array',
  //       items: {
  //         $ref: '#/components/schemas/PetSummarySerializer',
  //       },
  //     },
  //   })
  // })

  it('supports rendering a Dream model', () => {
    interface User {
      id: string
      name?: string
      birthdate?: CalendarDate
      pets: DreamPet[]
    }

    const birthdate = CalendarDate.fromISO('1950-10-02')
    const pet1: DreamPet = DreamPet.new({ id: '3', name: 'Snoopy', species: 'dog' })
    const pet2: DreamPet = DreamPet.new({ id: '7', name: 'Woodstock', species: 'frog' })
    pet1.ratings = []
    pet2.ratings = []
    const user: User = { id: '11', name: 'Charlie', birthdate, pets: [pet1, pet2] }

    const MySerializer = ($data: User) =>
      SimpleObjectSerializer($data).rendersMany('pets', { serializerKey: 'summary' })

    const serializer = MySerializer(user)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
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

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      pets: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/PetSerializer',
        },
      },
    })
  })

  it("supports customizing the name of the thing rendered via { as: '...' } (replaces `source: string`)", () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const pet1: DreamPet = DreamPet.new({ id: '3', name: 'Snoopy', species: 'dog' })
    const pet2: DreamPet = DreamPet.new({ id: '7', name: 'Woodstock', species: 'frog' })
    pet1.ratings = []
    pet2.ratings = []
    const user: User = { id: '11', name: 'Charlie', birthdate, pets: [pet1, pet2] }

    const MySerializer = ($data: User) => SimpleObjectSerializer($data).rendersMany('pets', { as: 'pets2' })

    const serializer = MySerializer(user)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
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

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      pets2: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/PetSerializer',
        },
      },
    })
  })

  it('supports sending a custom serializer', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const pet1: Pet = { id: '3', name: 'Snoopy', species: 'dog' }
    const pet2: Pet = { id: '7', name: 'Woodstock', species: 'frog' }
    pet1.ratings = []
    pet2.ratings = []
    const user: User = { id: '11', name: 'Charlie', birthdate, pets: [pet1, pet2] }

    const CustomSerializer = ($data: Pet) =>
      SimpleObjectSerializer($data).attribute('name', ['string', 'null'])
    const MySerializer = ($data: User) =>
      SimpleObjectSerializer($data).rendersMany('pets', { serializer: () => CustomSerializer })

    const serializer = MySerializer(user)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      pets: [
        {
          name: 'Snoopy',
        },
        {
          name: 'Woodstock',
        },
      ],
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      pets: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: ['string', 'null'],
            },
          },
        },
      },
    })
  })

  it('supports setting the custom $ref path to a custom serializer', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const pet1: Pet = { id: '3', name: 'Snoopy', species: 'dog' }
    const pet2: Pet = { id: '7', name: 'Woodstock', species: 'frog' }
    pet1.ratings = []
    pet2.ratings = []
    const user: User = { id: '11', name: 'Charlie', birthdate, pets: [pet1, pet2] }

    const CustomSerializer = ($data: User) =>
      SimpleObjectSerializer($data).attribute('name', ['string', 'null'])
    const MySerializer = ($data: User) =>
      SimpleObjectSerializer($data).rendersMany(
        'pets',
        { serializer: () => CustomSerializer },
        { customSerializerRefPath: 'MyCustomSerializer' }
      )

    const serializer = MySerializer(user)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      pets: [
        {
          name: 'Snoopy',
        },
        {
          name: 'Woodstock',
        },
      ],
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      pets: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/MyCustomSerializer',
        },
      },
    })
  })
})
