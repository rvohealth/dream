import { CalendarDate, ViewModelSerializer } from '../../../../src/index.js'
import SerializerOpenapiRenderer from '../../../../src/serializer/SerializerOpenapiRenderer.js'
import SerializerRenderer from '../../../../src/serializer/SerializerRenderer.js'
import Balloon from '../../../../test-app/app/models/Balloon.js'
import PetViewModel from '../../../../test-app/app/view-models/PetViewModel.js'
import UserViewModel from '../../../../test-app/app/view-models/UserViewModel.js'

describe('ViewModelSerializer rendersMany', () => {
  it('renders the associated objects', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = new UserViewModel({ id: '7', name: 'Charlie', birthdate })
    const pet1 = new PetViewModel({ id: '3', user, name: 'Snoopy', species: 'dog' })
    const pet2 = new PetViewModel({ id: '4', user, name: 'Woodstock', species: 'frog' })
    user.pets = [pet1, pet2]

    const MySerializer = (data: UserViewModel) =>
      ViewModelSerializer(UserViewModel, data).rendersMany('pets', { viewModelClass: PetViewModel })

    const serializer = MySerializer(user)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
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
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      pets: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/view-model_PetSerializer',
        },
      },
    })
  })

  it('expands STI base model into OpenAPI for all of the child types', () => {
    const MySerializer = (data: UserViewModel) =>
      ViewModelSerializer(UserViewModel, data).rendersMany('balloons', { dreamClass: Balloon })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      balloons: {
        type: 'array',
        items: {
          anyOf: [
            {
              $ref: '#/components/schemas/Balloon_Latex_AnimalSerializer',
            },
            {
              $ref: '#/components/schemas/Balloon_LatexSerializer',
            },
            {
              $ref: '#/components/schemas/Balloon_MylarSerializer',
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
      ViewModelSerializer(UserViewModel, data).rendersMany('pets', {
        viewModelClass: PetViewModel,
        serializerKey: 'summary',
      })

    const serializer = MySerializer(user)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
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
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      pets: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/view-model_PetSummarySerializer',
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
      ViewModelSerializer(UserViewModel, data).rendersMany('pets', {
        viewModelClass: PetViewModel,
        as: 'pets2',
      })

    const serializer = MySerializer(user)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
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
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      pets2: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/view-model_PetSerializer',
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

    const CustomSerializer = (data: PetViewModel) => ViewModelSerializer(PetViewModel, data).attribute('name')
    ;(CustomSerializer as any)['globalName'] = 'CustomPetSerializer'
    const MySerializer = (data: UserViewModel) =>
      ViewModelSerializer(UserViewModel, data).rendersMany('pets', {
        serializerCallback: () => CustomSerializer,
      })

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
          $ref: '#/components/schemas/CustomPetSerializer',
        },
      },
    })
  })
})
