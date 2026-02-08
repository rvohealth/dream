import ObjectSerializer from '../../../../src/serializer/ObjectSerializer.js'
import CalendarDate from '../../../../src/utils/datetime/CalendarDate.js'
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
  })
})
