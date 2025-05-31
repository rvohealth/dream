import { CalendarDate, DreamSerializer } from '../../../../src/index.js'
import SerializerOpenapiRenderer from '../../../../src/serializer/SerializerOpenapiRenderer.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import User from '../../../../test-app/app/models/User.js'

describe('DreamSerializer rendersMany', () => {
  it('renders the associated objects', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = User.new({ id: '7', name: 'Charlie', birthdate })
    const pet1 = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })
    const pet2 = Pet.new({ id: '4', user, name: 'Woodstock', species: 'frog' })
    pet1.ratings = []
    pet2.ratings = []
    user.pets = [pet1, pet2]

    const MySerializer = (data: User) => DreamSerializer(User, data).rendersMany('pets')

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

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    const results = serializerOpenapiRenderer['renderedOpenapiAttributes']()
    expect(results.attributes).toEqual({
      pets: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Pet',
        },
      },
    })

    expect(results.referencedSerializers).toHaveLength(2)
    expect((results.referencedSerializers[0] as any).globalName).toEqual('PetSerializer')
    expect((results.referencedSerializers[1] as any).globalName).toEqual('RatingSerializer')
  })

  it('expands STI base model into OpenAPI for all of the child types', () => {
    const MySerializer = (data: User) => DreamSerializer(User, data).rendersMany('balloons')

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    const results = serializerOpenapiRenderer['renderedOpenapiAttributes']()
    expect(results.attributes).toEqual({
      balloons: {
        type: 'array',
        items: {
          anyOf: [
            {
              $ref: '#/components/schemas/BalloonLatex',
            },
            {
              $ref: '#/components/schemas/BalloonLatexAnimal',
            },
            {
              $ref: '#/components/schemas/BalloonMylar',
            },
          ],
        },
      },
    })

    expect(results.referencedSerializers).toHaveLength(3)
    expect((results.referencedSerializers[0] as any).globalName).toEqual('Balloon/Latex/AnimalSerializer')
    expect((results.referencedSerializers[1] as any).globalName).toEqual('Balloon/LatexSerializer')
    expect((results.referencedSerializers[2] as any).globalName).toEqual('Balloon/MylarSerializer')
  })

  it('supports specifying the serializerKey', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = User.new({ id: '7', name: 'Charlie', birthdate })
    const pet1 = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog', favoriteTreats: ['chicken'] })
    const pet2 = Pet.new({
      id: '4',
      user,
      name: 'Woodstock',
      species: 'frog',
      favoriteTreats: ['ocean fish'],
    })
    pet1.ratings = []
    pet2.ratings = []
    user.pets = [pet1, pet2]

    const MySerializer = (data: User) =>
      DreamSerializer(User, data).rendersMany('pets', { serializerKey: 'summary' })

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

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    const results = serializerOpenapiRenderer['renderedOpenapiAttributes']()
    expect(results.attributes).toEqual({
      pets: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/PetSummary',
        },
      },
    })

    expect(results.referencedSerializers).toHaveLength(1)
    expect((results.referencedSerializers[0] as any).globalName).toEqual('PetSummarySerializer')
  })

  it("supports customizing the name of the thing rendered via { as: '...' } (replaces `source: string`)", () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = User.new({ id: '7', name: 'Charlie', birthdate })
    const pet1 = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })
    const pet2 = Pet.new({ id: '4', user, name: 'Woodstock', species: 'frog' })
    pet1.ratings = []
    pet2.ratings = []
    user.pets = [pet1, pet2]

    const MySerializer = (data: User) => DreamSerializer(User, data).rendersMany('pets', { as: 'pets2' })

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

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    const results = serializerOpenapiRenderer['renderedOpenapiAttributes']()
    expect(results.attributes).toEqual({
      pets2: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Pet',
        },
      },
    })

    expect(results.referencedSerializers).toHaveLength(2)
    expect((results.referencedSerializers[0] as any).globalName).toEqual('PetSerializer')
    expect((results.referencedSerializers[1] as any).globalName).toEqual('RatingSerializer')
  })

  it('supports supplying a custom serializer', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = User.new({ id: '7', name: 'Charlie', birthdate })
    const pet1 = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })
    const pet2 = Pet.new({ id: '4', user, name: 'Woodstock', species: 'frog' })
    pet1.ratings = []
    pet2.ratings = []
    user.pets = [pet1, pet2]

    const CustomSerializer = (data: Pet) => DreamSerializer(Pet, data).attribute('name')
    ;(CustomSerializer as any)['globalName'] = 'CustomPetSerializer'
    ;(CustomSerializer as any)['openapiName'] = 'CustomPet'
    const MySerializer = (data: User) =>
      DreamSerializer(User, data).rendersMany('pets', { serializer: CustomSerializer })

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

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    const results = serializerOpenapiRenderer['renderedOpenapiAttributes']()
    expect(results.attributes).toEqual({
      pets: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/CustomPet',
        },
      },
    })

    expect(results.referencedSerializers).toEqual([CustomSerializer])
  })

  it('passes passthrough data', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = User.new({ id: '7', name: 'Charlie', birthdate })
    const pet1 = Pet.new({ id: '3', user, name: 'Snoopy', species: 'dog' })
    const pet2 = Pet.new({ id: '4', user, name: 'Woodstock', species: 'frog' })
    pet1.ratings = []
    pet2.ratings = []
    user.pets = [pet1, pet2]

    interface PassthroughData {
      locale: 'en-US' | 'es-ES'
    }

    const CustomSerializer = (data: Pet, passthroughData: PassthroughData) =>
      DreamSerializer(Pet, data, passthroughData).customAttribute(
        'title',
        () => `${passthroughData.locale}-${data.name}`,
        { openapi: 'string' }
      )
    ;(CustomSerializer as any)['globalName'] = 'CustomPetSerializer'
    ;(CustomSerializer as any)['openapiName'] = 'CustomPet'
    const MySerializer = (data: User) =>
      DreamSerializer(User, data).rendersMany('pets', { serializer: CustomSerializer })

    const serializer = MySerializer(user)

    expect(serializer.render({ locale: 'en-US' })).toEqual({
      pets: [
        {
          title: 'en-US-Snoopy',
        },
        {
          title: 'en-US-Woodstock',
        },
      ],
    })
  })
})
