import { CalendarDate, SimpleObjectSerializer } from '../../../../src/index.js'
import SerializerOpenapiRenderer from '../../../../src/serializer/SerializerOpenapiRenderer.js'
import SerializerRenderer from '../../../../src/serializer/SerializerRenderer.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import User from '../../../../test-app/app/models/User.js'

describe('SimpleObjectSerializer rendersOne', () => {
  it('renders the associated objects', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = { name: 'Charlie', birthdate }
    const pet = { user, name: 'Snoopy', species: 'dog' }

    const MySerializer = ($data: Pet) => SimpleObjectSerializer(Pet, $data).rendersOne('user')

    const serializer = MySerializer(pet)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      user: {
        id: user.id,
        name: 'Charlie',
        birthdate: expect.toEqualCalendarDate(birthdate),
      },
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      user: {
        $ref: '#/components/schemas/UserSerializer',
      },
    })
  })

  it('supports specifying the serializerKey', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = { name: 'Charlie', birthdate, favoriteWord: 'hello' }
    const pet = { user, name: 'Snoopy', species: 'dog' }

    const MySerializer = ($data: Pet) =>
      SimpleObjectSerializer(Pet, $data).rendersOne('user', { serializerKey: 'summary' })

    const serializer = MySerializer(pet)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      user: {
        id: user.id,
        favoriteWord: 'hello',
      },
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      user: {
        $ref: '#/components/schemas/UserSummarySerializer',
      },
    })
  })

  it("supports customizing the name of the thing rendered via { as: '...' } (replaces `source: string`)", () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = { name: 'Charlie', birthdate }
    const pet = { user, name: 'Snoopy', species: 'dog' }

    const MySerializer = ($data: Pet) =>
      SimpleObjectSerializer(Pet, $data).rendersOne('user', { as: 'user2' })

    const serializer = MySerializer(pet)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      user2: {
        id: user.id,
        name: 'Charlie',
        birthdate: expect.toEqualCalendarDate(birthdate),
      },
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      user2: {
        $ref: '#/components/schemas/UserSerializer',
      },
    })
  })

  it('supports sending a custom serializer', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = { name: 'Charlie', birthdate }
    const pet = { user, name: 'Snoopy', species: 'dog' }

    const CustomSerializer = ($data: User) => SimpleObjectSerializer($data).attribute('name')
    const MySerializer = ($data: Pet) =>
      SimpleObjectSerializer(Pet, $data).rendersOne('user', { serializer: () => CustomSerializer })

    const serializer = MySerializer(pet)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      user: {
        name: 'Charlie',
      },
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      user: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: ['string', 'null'],
          },
        },
      },
    })
  })

  it('supports setting the custom $ref path to a custom serializer', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = { name: 'Charlie', birthdate }
    const pet = { user, name: 'Snoopy', species: 'dog' }

    const CustomSerializer = ($data: User) => SimpleObjectSerializer($data).attribute('name')
    const MySerializer = ($data: Pet) =>
      SimpleObjectSerializer(Pet, $data).rendersOne(
        'user',
        { serializer: () => CustomSerializer },
        { customSerializerRefPath: 'MyCustomSerializer' }
      )

    const serializer = MySerializer(pet)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      user: {
        name: 'Charlie',
      },
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      user: {
        $ref: '#/components/schemas/MyCustomSerializer',
      },
    })
  })
})
