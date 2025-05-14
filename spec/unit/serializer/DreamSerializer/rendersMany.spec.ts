import { CalendarDate, DreamSerializer } from '../../../../src/index.js'
import SerializerOpenapiRenderer from '../../../../src/serializer/SerializerOpenapiRenderer.js'
import SerializerRenderer from '../../../../src/serializer/SerializerRenderer.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import User from '../../../../test-app/app/models/User.js'

describe('DreamSerializer rendersMany', () => {
  it.only('renders the associated objects', () => {
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
})
