import ObjectSerializer from '../../../../src/serializer/ObjectSerializer.js'
import { nullFlattenedOpenapiKeysOfOtherVariants } from '../../../../src/serializer/helpers/nullFlattenedSerializerKeys.js'
import { OpenapiSchemaBodyShorthand } from '../../../../src/types/openapi.js'
import CalendarDate from '../../../../src/utils/datetime/CalendarDate.js'
import Balloon from '../../../../test-app/app/models/Balloon.js'
import Latex from '../../../../test-app/app/models/Balloon/Latex.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import LatexSerializer from '../../../../test-app/app/serializers/Balloon/LatexSerializer.js'
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

    it('renders null for every key its openapi declares when the callback returns null or undefined', () => {
      const openapi = {
        type: 'object',
        properties: { lat: { type: 'number' }, lng: { type: 'number' } },
      } as const

      const MySerializer = (user: User) =>
        ObjectSerializer(user)
          .attribute('email', { openapi: 'string' })
          .customAttribute('nullCoordinates', () => null, { flatten: true, openapi })
          .customAttribute('undefinedCoordinates', () => undefined, { flatten: true, openapi })

      expect(MySerializer({ email: 'abc', password: '123' }).render()).toEqual({
        email: 'abc',
        lat: null,
        lng: null,
      })
    })

    it('renders its openapi properties keys as written under snake casing, whether the value is present or null', () => {
      const MySerializer = (user: User, details: { phoneNumber: string } | { faxNumber: string } | null) =>
        ObjectSerializer(user)
          .attribute('email', { openapi: 'string' })
          .customAttribute('details', () => details, {
            flatten: true,
            openapi: {
              anyOf: [
                { type: 'object', properties: { phoneNumber: 'string' }, required: ['phoneNumber'] },
                { type: 'object', properties: { faxNumber: 'string' }, required: ['faxNumber'] },
              ],
            },
          })

      const user: User = { email: 'abc', password: '123' }

      expect(MySerializer(user, { phoneNumber: '1' }).render({}, { casing: 'snake' })).toEqual({
        email: 'abc',
        phoneNumber: '1',
        faxNumber: null,
      })
      expect(MySerializer(user, null).render({}, { casing: 'snake' })).toEqual({
        email: 'abc',
        phoneNumber: null,
        faxNumber: null,
      })
    })

    it('renders null for the keys an anyOf member’s serializer requires whichever order the members are declared in, when another member flattens that serializer with `required: false`', () => {
      interface Keyed {
        optKey?: string
        cKey?: string
        rKey?: string
      }

      const CSerializer = (data: Keyed) => ObjectSerializer(data).attribute('cKey', { openapi: 'string' })
      const RSerializer = (data: Keyed) => ObjectSerializer(data).attribute('rKey', { openapi: 'string' })
      const OptSerializer = (data: Keyed) =>
        ObjectSerializer(data)
          .attribute('optKey', { openapi: 'string' })
          .customAttribute('c', () => undefined, {
            flatten: true,
            required: false,
            openapi: { $serializer: CSerializer },
          })

      const optFirst: OpenapiSchemaBodyShorthand = {
        anyOf: [{ $serializer: OptSerializer }, { $serializer: CSerializer }, { $serializer: RSerializer }],
      }
      const cFirst: OpenapiSchemaBodyShorthand = {
        anyOf: [{ $serializer: CSerializer }, { $serializer: OptSerializer }, { $serializer: RSerializer }],
      }

      ;[optFirst, cFirst].forEach(openapi => {
        const PresentSerializer = (user: User) =>
          ObjectSerializer(user).customAttribute('details', () => RSerializer({ rKey: 'x' }), {
            flatten: true,
            openapi,
          })
        const NullSerializer = (user: User) =>
          ObjectSerializer(user).customAttribute('details', () => null, { flatten: true, openapi })

        expect(PresentSerializer({ email: 'abc', password: '123' }).render()).toEqual({
          optKey: null,
          cKey: null,
          rKey: 'x',
        })
        expect(NullSerializer({ email: 'abc', password: '123' }).render()).toEqual({
          optKey: null,
          cKey: null,
          rKey: null,
        })
      })
    })

    it('renders null for the keys an object allOf member lists in its own `required` array when another member renders', () => {
      const MySerializer = (user: User, details: { faxNumber: string } | null) =>
        ObjectSerializer(user)
          .attribute('email', { openapi: 'string' })
          .customAttribute('details', () => details, {
            flatten: true,
            openapi: {
              anyOf: [
                {
                  type: 'object',
                  required: ['kind', 'phoneNumber'],
                  allOf: [{ type: 'object', properties: { kind: 'string', phoneNumber: 'string' } }],
                },
                { type: 'object', properties: { faxNumber: 'string' }, required: ['faxNumber'] },
              ],
            },
          })

      const user: User = { email: 'abc', password: '123' }

      expect(MySerializer(user, { faxNumber: '9' }).render()).toEqual({
        email: 'abc',
        kind: null,
        phoneNumber: null,
        faxNumber: '9',
      })
      expect(MySerializer(user, null).render()).toEqual({
        email: 'abc',
        kind: null,
        phoneNumber: null,
        faxNumber: null,
      })
    })

    it('renders a returned serializer built over null data as the callback returning null renders', () => {
      interface Address {
        city: string
      }

      const AddressSerializer = (address: Address | null) =>
        ObjectSerializer(address).attribute('city', { openapi: 'string' })

      const WrappedSerializer = (user: User) =>
        ObjectSerializer(user)
          .attribute('email', { openapi: 'string' })
          .customAttribute('address', () => AddressSerializer(null), {
            flatten: true,
            openapi: { $serializer: AddressSerializer },
          })
      const NullSerializer = (user: User) =>
        ObjectSerializer(user)
          .attribute('email', { openapi: 'string' })
          .customAttribute('address', () => null, {
            flatten: true,
            openapi: { $serializer: AddressSerializer },
          })

      const user: User = { email: 'abc', password: '123' }

      expect(WrappedSerializer(user).render()).toEqual({ email: 'abc', city: null })
      expect(WrappedSerializer(user).render()).toEqual(NullSerializer(user).render())
    })

    it('renders a returned anyOf member’s serializer built over null data as the callback returning null renders', () => {
      const ASerializer = (data: { aKey: string } | null) =>
        ObjectSerializer(data).attribute('aKey', { openapi: 'string' })
      const BSerializer = (data: { bKey: string } | null) =>
        ObjectSerializer(data).attribute('bKey', { openapi: 'string' })

      const openapi: OpenapiSchemaBodyShorthand = {
        anyOf: [{ $serializer: ASerializer }, { $serializer: BSerializer }, { type: 'null' }],
      }

      const WrappedSerializer = (user: User) =>
        ObjectSerializer(user).customAttribute('details', () => ASerializer(null), { flatten: true, openapi })
      const NullSerializer = (user: User) =>
        ObjectSerializer(user).customAttribute('details', () => null, { flatten: true, openapi })

      const user: User = { email: 'abc', password: '123' }

      expect(WrappedSerializer(user).render()).toEqual({ aKey: null, bKey: null })
      expect(WrappedSerializer(user).render()).toEqual(NullSerializer(user).render())
    })

    it('renders a plain object several oneOf members declare as the member whose required keys it has, whichever order they are declared in, leaving that member’s optional keys absent', () => {
      const one: OpenapiSchemaBodyShorthand = {
        type: 'object',
        properties: { kind: 'string', a: 'string' },
        required: ['kind'],
      }
      const two: OpenapiSchemaBodyShorthand = {
        type: 'object',
        properties: { kind: 'string', a: 'string', b: 'string' },
        required: ['kind', 'a', 'b'],
      }

      ;[{ oneOf: [one, two] }, { oneOf: [two, one] }].forEach(openapi => {
        const MySerializer = (user: User) =>
          ObjectSerializer(user).customAttribute('details', () => ({ kind: 'one' }), {
            flatten: true,
            openapi,
          })

        const rendered = MySerializer({ email: 'abc', password: '123' }).render()

        expect(rendered).toEqual({ kind: 'one', b: null })
        expect(rendered).toEqual({ ...nullFlattenedOpenapiKeysOfOtherVariants(openapi, one), kind: 'one' })
      })
    })

    it('renders null for the keys another STI child requires beside a plain object returned for a $serializable ref, as beside the child’s serializer', () => {
      const latex = Latex.new({ color: 'red' })

      const PlainSerializer = (user: User) =>
        ObjectSerializer(user).customAttribute('balloon', () => LatexSerializer(latex).render(), {
          flatten: true,
          openapi: { $serializable: Balloon },
        })
      const WrappedSerializer = (user: User) =>
        ObjectSerializer(user).customAttribute('balloon', () => LatexSerializer(latex), {
          flatten: true,
          openapi: { $serializable: Balloon },
        })

      const user: User = { email: 'abc', password: '123' }

      expect(PlainSerializer(user).render()).toEqual({ color: 'red', mylarOnlyProperty: null })
      expect(PlainSerializer(user).render()).toEqual(WrappedSerializer(user).render())
      expect(PlainSerializer(user).render()).toEqual({
        ...nullFlattenedOpenapiKeysOfOtherVariants(
          { $serializable: Balloon },
          { $serializer: LatexSerializer }
        ),
        color: 'red',
      })
    })
  })

  // type tests are all intentionally skipped. Instead, add @ts-expect-error
  // comments, which will become invalid if the type errors stop raising
  context('type tests', () => {
    it.skip('takes no as, default or precision, since the callback computes the value', () => {
      const user: User = { email: 'abc', password: '123' }

      ObjectSerializer(user).customAttribute('email', () => user.email, {
        openapi: 'string',
        // @ts-expect-error the attribute is named by its first argument
        as: 'other',
      })
      ObjectSerializer(user).customAttribute('email', () => undefined, {
        openapi: 'string',
        // @ts-expect-error any fallback belongs in the callback
        default: 'fallback',
      })
      ObjectSerializer(user).customAttribute('rating', () => 3.14159, {
        openapi: 'decimal',
        // @ts-expect-error any rounding belongs in the callback
        precision: 2,
      })
    })

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
