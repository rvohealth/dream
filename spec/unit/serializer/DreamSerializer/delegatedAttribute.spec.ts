import DreamSerializer from '../../../../src/serializer/DreamSerializer.js'
import CalendarDate from '../../../../src/utils/datetime/CalendarDate.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import User from '../../../../test-app/app/models/User.js'

describe('DreamSerializer#delegatedAttribute', () => {
  it('delegates value and type to the specified target', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = User.new({ name: 'Charlie', birthdate })
    const pet = Pet.new({ user, name: 'Snoopy' })

    const MySerializer = (data: Pet) =>
      DreamSerializer(Pet, data)
        .delegatedAttribute('user', 'name')
        // passing a generic argument here just to ensure the types stay correct
        .delegatedAttribute<Pet>('user', 'birthdate')

    const serializer = MySerializer(pet)

    expect(serializer.render()).toEqual({
      name: 'Charlie',
      birthdate: birthdate.toISO(),
    })
  })

  it('supports specifying a default value', () => {
    const user = User.new({})
    const pet = Pet.new({ user, name: 'Snoopy' })

    const MySerializer = (data: Pet) =>
      DreamSerializer(Pet, data).delegatedAttribute('user', 'name', {
        default: 'Woodstock',
        openapi: 'string',
      })

    const serializer = MySerializer(pet)

    expect(serializer.render()).toEqual({
      name: 'Woodstock',
    })
  })

  context('when the target object is null', () => {
    it('returns null', () => {
      const pet = Pet.new({ user: null, name: 'Snoopy' })

      const MySerializer = (data: Pet) =>
        DreamSerializer(Pet, data)
          .delegatedAttribute('user', 'name', { openapi: 'string' })
          // passing a generic argument here just to ensure the types stay correct
          .delegatedAttribute<Pet>('user', 'birthdate', { openapi: 'date' })

      const serializer = MySerializer(pet)

      expect(serializer.render()).toEqual({
        name: null,
        birthdate: null,
      })
    })

    it('supports specifying a default value', () => {
      const pet = Pet.new({ user: null, name: 'Snoopy' })

      const MySerializer = (data: Pet) =>
        DreamSerializer(Pet, data).delegatedAttribute('user', 'name', {
          default: 'Woodstock',
          openapi: 'string',
        })

      const serializer = MySerializer(pet)

      expect(serializer.render()).toEqual({
        name: 'Woodstock',
      })
    })
  })
})
