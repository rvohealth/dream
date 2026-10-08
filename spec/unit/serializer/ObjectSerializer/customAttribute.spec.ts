import ObjectSerializer from '../../../../src/serializer/ObjectSerializer.js'
import CalendarDate from '../../../../src/utils/datetime/CalendarDate.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import UserSerializer from '../../../../test-app/app/serializers/UserSerializer.js'
import fleshedOutModelForOpenapiTypeSpecs from '../../../scaffold/fleshedOutModelForOpenapiTypeSpecs.js'

interface User {
  email: string
  password: string
  name?: string
  birthdate?: CalendarDate
}

interface ModelForOpenapiTypeSpecs {
  volume?: number
  requiredNicknames?: string[]
  birthdate?: CalendarDate
}

describe('ObjectSerializer#customAttribute', () => {
  it('can render the results of calling the callback function', () => {
    const MySerializer = (user: User) =>
      ObjectSerializer(user).customAttribute('email', () => `${user.email}@peanuts.com`, {
        openapi: 'string',
      })

    const serializer = MySerializer({ email: 'abc', password: '123' })
    expect(serializer.render()).toEqual({
      email: 'abc@peanuts.com',
    })
  })

  it('can override the OpenAPI shape with OpenAPI shorthand', async () => {
    const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
      ObjectSerializer(data).customAttribute('birthdate', () => data.birthdate?.toDateTime()?.toISO(), {
        openapi: 'date-time',
      })
    const model = await fleshedOutModelForOpenapiTypeSpecs()
    const serializer = MySerializer({ birthdate: CalendarDate.fromISO('1950-10-02') })
    expect(serializer.render()).toEqual({
      birthdate: model.birthdate!.toDateTime().toISO(),
    })
  })

  context('with passthrough data', () => {
    it('can access the passthrough data in the function', () => {
      const MySerializer = (user: User, passthroughData: { locale: string }) =>
        ObjectSerializer(user, passthroughData).customAttribute(
          'email',
          () => `${user.email}.${passthroughData.locale}@peanuts.com`,
          { openapi: 'string' }
        )

      const serializer = MySerializer({ email: 'abc', password: '123' }, { locale: 'en-US' })
      expect(serializer.render()).toEqual({
        email: 'abc.en-US@peanuts.com',
      })
    })
  })

  context('when serializing null', () => {
    it('renders the attributes as null', () => {
      const MySerializer = (user: User | null) =>
        ObjectSerializer(user).customAttribute('email', () => `${user!.email}@peanuts.com`, {
          openapi: 'string',
        })

      const serializer = MySerializer(null)
      expect(serializer.render()).toBeNull()
    })
  })

  context('undefined attributes', () => {
    it('are rendered as null', () => {
      const MySerializer = (user: User) =>
        ObjectSerializer(user).customAttribute('email', () => user.email, {
          openapi: 'string',
        })

      const serializer = MySerializer({ email: undefined as unknown as string, password: '123' })

      expect(serializer.render()).toEqual({
        email: null,
      })
    })

    context('when required: false', () => {
      it('are rendered as undefined', () => {
        const MySerializer = (user: User) =>
          ObjectSerializer(user).customAttribute('email', () => user.email, {
            required: false,
            openapi: 'string',
          })

        const serializer = MySerializer({ email: undefined as unknown as string, password: '123' })

        expect(serializer.render()).toEqual({})
      })
    })

    context('with a default', () => {
      it('are rendered as null', () => {
        const MySerializer = (user: User) =>
          ObjectSerializer(user).customAttribute('email', () => user.email, {
            default: 'fallback@peanuts.com',
            openapi: 'string',
          })

        const serializer = MySerializer({ email: undefined as unknown as string, password: '123' })

        expect(serializer.render()).toEqual({
          email: null,
        })
      })
    })
  })

  context('flatten', () => {
    it('spreads the keys of a returned plain object into the parent output', () => {
      const MySerializer = (user: User) =>
        ObjectSerializer(user)
          .attribute('email', { openapi: 'string' })
          .customAttribute('coordinates', () => ({ lat: 40.7, lng: -74.0 }), {
            flatten: true,
            openapi: {
              type: 'object',
              required: ['lat', 'lng'],
              properties: {
                lat: { type: 'number' },
                lng: { type: 'number' },
              },
            },
          })

      expect(MySerializer({ email: 'abc', password: '123' }).render()).toEqual({
        email: 'abc',
        lat: 40.7,
        lng: -74.0,
      })
    })

    it('adds no keys for a callback that returns null or undefined', () => {
      const openapi = {
        type: 'object',
        properties: { lat: { type: 'number' }, lng: { type: 'number' } },
      } as const

      const MySerializer = (user: User) =>
        ObjectSerializer(user)
          .attribute('email', { openapi: 'string' })
          .customAttribute('nullCoordinates', () => null, { flatten: true, openapi })
          .customAttribute('undefinedCoordinates', () => undefined, { flatten: true, openapi })

      expect(MySerializer({ email: 'abc', password: '123' }).render()).toEqual({ email: 'abc' })
    })
  })

  // type tests are all intentionally skipped. Instead, add @ts-expect-error
  // comments, which will become invalid if the type errors stop raising
  context('type tests', () => {
    it.skip('a flattened serializer ref may be nullable but not a list', () => {
      const data = { email: 'abc' }

      ObjectSerializer(data).customAttribute('user', () => null, {
        flatten: true,
        openapi: { $serializer: UserSerializer, maybeNull: true },
      })

      ObjectSerializer(data).customAttribute('users', () => [], {
        openapi: { $serializer: UserSerializer, many: true },
      })

      // @ts-expect-error a list has no properties to spread into the parent
      ObjectSerializer(data).customAttribute('users', () => [], {
        flatten: true,
        openapi: { $serializer: UserSerializer, many: true },
      })

      // @ts-expect-error a list has no properties to spread into the parent
      ObjectSerializer(data).customAttribute('users', () => [], {
        flatten: true,
        openapi: { $serializable: Pet, many: true },
      })
    })
  })
})
