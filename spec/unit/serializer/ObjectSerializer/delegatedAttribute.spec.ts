import { CalendarDate, ObjectSerializer } from '../../../../src/index.js'

interface User {
  name?: string
  birthdate?: CalendarDate
}

interface Pet {
  name?: string
  user?: User
}

describe('ObjectSerializer delegated attributes', () => {
  it('delegates value and type to the specified target', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user: User = { name: 'Charlie', birthdate }
    const pet: Pet = { user, name: 'Snoopy' }

    const MySerializer = (data: Pet) =>
      ObjectSerializer(data)
        .delegatedAttribute('user', 'name', { openapi: 'string' })
        // passing a generic argument here just to ensure the types stay correct
        .delegatedAttribute<Pet>('user', 'birthdate', { openapi: 'date' })

    const serializer = MySerializer(pet)

    expect(serializer.render()).toEqual({
      name: 'Charlie',
      birthdate: birthdate.toISO(),
    })
  })

  it('supports specifying a default value', () => {
    const user: User = {}
    const pet: Pet = { user, name: 'Snoopy' }

    const MySerializer = (data: Pet) =>
      ObjectSerializer(data).delegatedAttribute('user', 'name', { default: 'Woodstock', openapi: 'string' })

    const serializer = MySerializer(pet)

    expect(serializer.render()).toEqual({
      name: 'Woodstock',
    })
  })

  context('when the target object is null', () => {
    it('delegates value and type to the specified target', () => {
      const pet: Pet = { name: 'Snoopy' }

      const MySerializer = (data: Pet) =>
        ObjectSerializer(data)
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
      const pet: Pet = { name: 'Snoopy' }

      const MySerializer = (data: Pet) =>
        ObjectSerializer(data).delegatedAttribute('user', 'name', { default: 'Woodstock', openapi: 'string' })

      const serializer = MySerializer(pet)

      expect(serializer.render()).toEqual({
        name: 'Woodstock',
      })
    })
  })
})
