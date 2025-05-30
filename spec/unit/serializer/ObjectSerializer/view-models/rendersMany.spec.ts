import { CalendarDate, ObjectSerializer } from '../../../../../src/index.js'
import SerializerOpenapiRenderer from '../../../../../src/serializer/SerializerOpenapiRenderer.js'
import Balloon from '../../../../../test-app/app/models/Balloon.js'
import PetViewModel from '../../../../../test-app/app/view-models/PetViewModel.js'
import UserViewModel from '../../../../../test-app/app/view-models/UserViewModel.js'

describe('ObjectSerializer (on a view model) rendersMany', () => {
  it('renders the associated objects', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = new UserViewModel({ id: '7', name: 'Charlie', birthdate })
    const pet1 = new PetViewModel({ id: '3', user, name: 'Snoopy', species: 'dog' })
    const pet2 = new PetViewModel({ id: '4', user, name: 'Woodstock', species: 'frog' })
    user.pets = [pet1, pet2]

    const MySerializer = (data: UserViewModel) =>
      ObjectSerializer(data).rendersMany('pets', { viewModelClass: PetViewModel })

    const serializer = MySerializer(user)

    expect(serializer.render()).toEqual({
      pets: [
        {
          id: pet1.id,
          name: 'Snoopy',
          favoriteDaysOfWeek: ['Monday', 'Tuesday'],
          favoriteTreats: [],
          species: 'dog',
        },
        {
          id: pet2.id,
          name: 'Woodstock',
          favoriteDaysOfWeek: ['Monday', 'Tuesday'],
          favoriteTreats: [],
          species: 'frog',
        },
      ],
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      pets: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/view-modelPet',
        },
      },
    })
  })

  it('expands STI base model into OpenAPI for all of the child types', () => {
    const MySerializer = (data: UserViewModel) =>
      ObjectSerializer(data).rendersMany('balloons', { dreamClass: Balloon })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      balloons: {
        type: 'array',
        items: {
          anyOf: [
            {
              $ref: '#/components/schemas/BalloonLatexAnimal',
            },
            {
              $ref: '#/components/schemas/BalloonLatex',
            },
            {
              $ref: '#/components/schemas/BalloonMylar',
            },
          ],
        },
      },
    })
  })

  it('supports specifying the serializerKey', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = new UserViewModel({ id: '7', name: 'Charlie', birthdate })
    const pet1 = new PetViewModel({
      id: '3',
      user,
      name: 'Snoopy',
      species: 'dog',
      favoriteTreats: ['chicken'],
    })
    const pet2 = new PetViewModel({
      id: '4',
      user,
      name: 'Woodstock',
      species: 'frog',
      favoriteTreats: ['ocean fish'],
    })
    user.pets = [pet1, pet2]

    const MySerializer = (data: UserViewModel) =>
      ObjectSerializer(data).rendersMany('pets', {
        viewModelClass: PetViewModel,
        serializerKey: 'summary',
      })

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
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      pets: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/PetSummary',
        },
      },
    })
  })

  it("supports customizing the name of the thing rendered via { as: '...' } (replaces `source: string`)", () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = new UserViewModel({ id: '7', name: 'Charlie', birthdate })
    const pet1 = new PetViewModel({ id: '3', user, name: 'Snoopy', species: 'dog' })
    const pet2 = new PetViewModel({ id: '4', user, name: 'Woodstock', species: 'frog' })
    user.pets = [pet1, pet2]

    const MySerializer = (data: UserViewModel) =>
      ObjectSerializer(data).rendersMany('pets', {
        viewModelClass: PetViewModel,
        as: 'pets2',
      })

    const serializer = MySerializer(user)

    expect(serializer.render()).toEqual({
      pets2: [
        {
          id: pet1.id,
          name: 'Snoopy',
          favoriteDaysOfWeek: ['Monday', 'Tuesday'],
          favoriteTreats: [],
          species: 'dog',
        },
        {
          id: pet2.id,
          name: 'Woodstock',
          favoriteDaysOfWeek: ['Monday', 'Tuesday'],
          favoriteTreats: [],
          species: 'frog',
        },
      ],
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      pets2: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/view-modelPet',
        },
      },
    })
  })

  it('supports supplying a custom serializer', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = new UserViewModel({ id: '7', name: 'Charlie', birthdate })
    const pet1 = new PetViewModel({ id: '3', user, name: 'Snoopy', species: 'dog' })
    const pet2 = new PetViewModel({ id: '4', user, name: 'Woodstock', species: 'frog' })
    user.pets = [pet1, pet2]

    const CustomSerializer = (data: PetViewModel) =>
      ObjectSerializer(data).attribute('name', { openapi: 'string' })
    ;(CustomSerializer as any)['globalName'] = 'CustomPetSerializer'
    ;(CustomSerializer as any)['openapiName'] = 'CustomPet'
    const MySerializer = (data: UserViewModel) =>
      ObjectSerializer(data).rendersMany('pets', {
        serializerCallback: () => CustomSerializer,
      })

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
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      pets: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/CustomPet',
        },
      },
    })
  })
})
