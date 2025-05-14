import { CalendarDate, DreamSerializer } from '../../../../src/index.js'
import SerializerOpenapiRenderer from '../../../../src/serializer/SerializerOpenapiRenderer.js'
import SerializerRenderer from '../../../../src/serializer/SerializerRenderer.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import User from '../../../../test-app/app/models/User.js'

describe('DreamSerializer rendersMany', () => {
  it('renders the associated objects', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = User.new({ name: 'Charlie', birthdate })
    const pet1 = Pet.new({ user, name: 'Snoopy', species: 'dog' })
    const pet2 = Pet.new({ user, name: 'Woodstock', species: 'frog' })
    pet1.ratings = []
    pet2.ratings = []
    user.pets = [pet1, pet2]

    const MySerializer = ($data: User) => DreamSerializer(User, $data).rendersMany('pets')

    const serializer = MySerializer(user)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer['renderedAttributes']).toEqual({
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

    MySerializer.openapiName = 'MySerializer'
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

  it('supports specifying the serializerKey', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = User.new({ name: 'Charlie', birthdate })
    const pet1 = Pet.new({ user, name: 'Snoopy', species: 'dog', favoriteTreats: ['chicken'] })
    const pet2 = Pet.new({ user, name: 'Woodstock', species: 'frog', favoriteTreats: ['ocean fish'] })
    pet1.ratings = []
    pet2.ratings = []
    user.pets = [pet1, pet2]

    const MySerializer = ($data: User) =>
      DreamSerializer(User, $data).rendersMany('pets', { serializerKey: 'summary' })

    const serializer = MySerializer(user)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer['renderedAttributes']).toEqual({
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

    MySerializer.openapiName = 'MySerializer'
    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      pets: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/PetSummarySerializer',
        },
      },
    })
  })

  it('supports customizing the name of the thing rendered (replaces `source: string`)', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = User.new({ name: 'Charlie', birthdate })
    const pet1 = Pet.new({ user, name: 'Snoopy', species: 'dog' })
    const pet2 = Pet.new({ user, name: 'Woodstock', species: 'frog' })
    pet1.ratings = []
    pet2.ratings = []
    user.pets = [pet1, pet2]

    const MySerializer = ($data: User) => DreamSerializer(User, $data).rendersMany('pets', { as: 'pets2' })

    const serializer = MySerializer(user)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer['renderedAttributes']).toEqual({
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

    MySerializer.openapiName = 'MySerializer'
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
    const user = User.new({ name: 'Charlie', birthdate })
    const pet1 = Pet.new({ user, name: 'Snoopy', species: 'dog' })
    const pet2 = Pet.new({ user, name: 'Woodstock', species: 'frog' })
    pet1.ratings = []
    pet2.ratings = []
    user.pets = [pet1, pet2]

    const CustomSerializer = ($data: Pet) => DreamSerializer(Pet, $data).attribute('name')
    const MySerializer = ($data: User) =>
      DreamSerializer(User, $data).rendersMany('pets', { serializer: () => CustomSerializer })

    const serializer = MySerializer(user)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer['renderedAttributes']).toEqual({
      pets: [
        {
          name: 'Snoopy',
        },
        {
          name: 'Woodstock',
        },
      ],
    })

    MySerializer.openapiName = 'MySerializer'
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
    const user = User.new({ name: 'Charlie', birthdate })
    const pet1 = Pet.new({ user, name: 'Snoopy', species: 'dog' })
    const pet2 = Pet.new({ user, name: 'Woodstock', species: 'frog' })
    pet1.ratings = []
    pet2.ratings = []
    user.pets = [pet1, pet2]

    const CustomSerializer = ($data: User) => DreamSerializer(Pet, $data).attribute('name')
    const MySerializer = ($data: User) =>
      DreamSerializer(User, $data).rendersMany(
        'pets',
        { serializer: () => CustomSerializer },
        { customSerializerRefPath: 'MyCustomSerializer' }
      )

    const serializer = MySerializer(user)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer['renderedAttributes']).toEqual({
      pets: [
        {
          name: 'Snoopy',
        },
        {
          name: 'Woodstock',
        },
      ],
    })

    MySerializer.openapiName = 'MySerializer'
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
