import { CalendarDate, ObjectSerializer } from '../../../../../src/index.js'
import PetViewModel from '../../../../../test-app/app/view-models/PetViewModel.js'
import UserViewModel from '../../../../../test-app/app/view-models/UserViewModel.js'

describe('ObjectSerializer#rendersMany (on a view model)', () => {
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
        serializer: CustomSerializer,
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
  })
})
