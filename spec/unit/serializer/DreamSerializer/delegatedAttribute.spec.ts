import { CalendarDate, DreamSerializer } from '../../../../src/index.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import User from '../../../../test-app/app/models/User.js'

describe('DreamSerializer delegated attributes', () => {
  it('delegates value and type to the specified target', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = User.new({ name: 'Charlie', birthdate })
    const pet = Pet.new({ user, name: 'Snoopy' })

    const MySerializer = (data: Pet) =>
      DreamSerializer(Pet, data)
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

  it('supports `sanitize` option to convert HTML-dangerous characters to safe representations', () => {
    const user = User.new({ name: 'He<\\/>o&World' })
    const pet = Pet.new({ user, name: 'Snoopy' })

    const MySerializer = (data: Pet) =>
      DreamSerializer(Pet, data).delegatedAttribute('user', 'name', {
        sanitize: 'htmlEntity',
        openapi: 'string',
      })

    const serializer = MySerializer(pet)

    expect(serializer.render()).toEqual({
      name: 'He&lt;\\&#x2F;&gt;o&amp;World',
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
