import ObjectSerializer from '../../../../src/serializer/ObjectSerializer.js'
import CalendarDate from '../../../../src/utils/datetime/CalendarDate.js'

interface User {
  name?: string
  birthdate?: CalendarDate
}

interface Pet {
  name?: string
  user?: User
  defaultLocaleUser?: User
}

describe('ObjectSerializer#delegatedAttribute', () => {
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

  context('when repeating the same key using required: false to shadow a default', () => {
    const MySerializer = (data: Pet) =>
      ObjectSerializer(data)
        .delegatedAttribute('defaultLocaleUser', 'name', { openapi: 'string' })
        .delegatedAttribute('user', 'name', { openapi: 'string', required: false })

    it('keeps the fallback value when the shadowing association is absent', () => {
      const pet: Pet = {
        defaultLocaleUser: { name: 'Fallback name' },
      }

      expect(MySerializer(pet).render()).toEqual({
        name: 'Fallback name',
      })
    })

    it('lets the shadowing association override the fallback value when present', () => {
      const pet: Pet = {
        defaultLocaleUser: { name: 'Fallback name' },
        user: { name: 'Shadowing name' },
      }

      expect(MySerializer(pet).render()).toEqual({
        name: 'Shadowing name',
      })
    })

    it('supports shadowing an output key renamed with as', () => {
      const pet: Pet = {
        defaultLocaleUser: { name: 'Fallback name' },
        user: { name: 'Shadowing name' },
      }

      const MySerializerWithAs = (data: Pet) =>
        ObjectSerializer(data)
          .delegatedAttribute('defaultLocaleUser', 'name', { as: 'displayName', openapi: 'string' })
          .delegatedAttribute('user', 'name', {
            as: 'displayName',
            openapi: 'string',
            required: false,
          })

      expect(MySerializerWithAs(pet).render()).toEqual({
        displayName: 'Shadowing name',
      })
    })

    it('keeps the fallback directive required for OpenAPI schema generation', () => {
      const attributes = (MySerializer({}) as any)['attributes']

      expect(attributes).toMatchObject([
        {
          type: 'delegatedAttribute',
          targetName: 'defaultLocaleUser',
          name: 'name',
          options: { openapi: 'string' },
        },
        {
          type: 'delegatedAttribute',
          targetName: 'user',
          name: 'name',
          options: { openapi: 'string', required: false },
        },
      ])
      expect(attributes[0].options).not.toHaveProperty('required')
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

    context('with optional: true', () => {
      it('renders the value as null (optional is an OpenAPI-only marker)', () => {
        const pet: Pet = { name: 'Snoopy' }

        const MySerializer = (data: Pet) =>
          ObjectSerializer(data).delegatedAttribute('user', 'name', { openapi: 'string', optional: true })

        const serializer = MySerializer(pet)

        expect(serializer.render()).toEqual({ name: null })
      })
    })

    context('with required: false', () => {
      it('omits the key from the rendered output', () => {
        const pet: Pet = { name: 'Snoopy' }

        const MySerializer = (data: Pet) =>
          ObjectSerializer(data).delegatedAttribute('user', 'name', { openapi: 'string', required: false })

        const serializer = MySerializer(pet)

        expect(serializer.render()).toEqual({})
      })
    })
  })

  context('undefined attributes', () => {
    it('are rendered as null', () => {
      const pet: Pet = { name: undefined as unknown as string }

      const MySerializer = (data: Pet) =>
        ObjectSerializer(data).delegatedAttribute('user', 'name', { openapi: 'string' })

      const serializer = MySerializer(pet)

      expect(serializer.render()).toEqual({
        name: null,
      })
    })

    context('when required: false', () => {
      it('are rendered as undefined', () => {
        const pet: Pet = { name: undefined as unknown as string }

        const MySerializer = (data: Pet) =>
          ObjectSerializer(data).delegatedAttribute('user', 'name', { required: false, openapi: 'string' })

        const serializer = MySerializer(pet)

        expect(serializer.render()).toEqual({})
      })
    })
  })
})
