import ObjectSerializer from '../../../../src/serializer/ObjectSerializer.js'
import { nullFlattenedOpenapiKeys } from '../../../../src/serializer/helpers/nullFlattenedSerializerKeys.js'
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

    it('renders no key its openapi leaves optional when the callback returns null or undefined', () => {
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

    it('renders null for each key its openapi `required` array lists when the callback returns null or undefined, leaving the others absent', () => {
      const openapi = {
        type: 'object' as const,
        properties: {
          lat: { type: 'number' as const },
          lng: { type: 'number' as const },
          altitude: { type: 'number' as const },
        },
        required: ['lat', 'lng'],
      }

      const NullSerializer = (user: User) =>
        ObjectSerializer(user)
          .attribute('email', { openapi: 'string' })
          .customAttribute('coordinates', () => null, { flatten: true, openapi })
      const UndefinedSerializer = (user: User) =>
        ObjectSerializer(user)
          .attribute('email', { openapi: 'string' })
          .customAttribute('coordinates', () => undefined, { flatten: true, openapi })

      const user: User = { email: 'abc', password: '123' }

      expect(NullSerializer(user).render()).toEqual({ email: 'abc', lat: null, lng: null })
      expect(UndefinedSerializer(user).render()).toEqual({ email: 'abc', lat: null, lng: null })
    })

    it('renders null for the keys a $serializer ref’s serializer requires when the callback returns null, leaving out its `required: false` keys', () => {
      const AddressSerializer = (address: { city: string; zip?: string }) =>
        ObjectSerializer(address)
          .attribute('city', { openapi: 'string' })
          .attribute('zip', { openapi: 'string', required: false })

      const MySerializer = (user: User) =>
        ObjectSerializer(user)
          .attribute('email', { openapi: 'string' })
          .customAttribute('address', () => null, {
            flatten: true,
            openapi: { $serializer: AddressSerializer },
          })

      expect(MySerializer({ email: 'abc', password: '123' }).render()).toEqual({ email: 'abc', city: null })
    })

    it('cases the top-level keys of a returned plain object per the render’s casing, leaving nested values as returned', () => {
      const MySerializer = (user: User) =>
        ObjectSerializer(user)
          .attribute('email', { openapi: 'string' })
          .customAttribute('location', () => ({ homeAddress: { streetName: 'Main' } }), {
            flatten: true,
            openapi: {
              type: 'object',
              properties: {
                homeAddress: { type: 'object', properties: { streetName: 'string' } },
              },
              required: ['homeAddress'],
            },
          })

      expect(MySerializer({ email: 'abc', password: '123' }).render({}, { casing: 'snake' })).toEqual({
        email: 'abc',
        home_address: { streetName: 'Main' },
      })
    })

    it('cases its keys per the render’s casing, whether the value is present or null', () => {
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
        phone_number: '1',
        fax_number: null,
      })
      expect(MySerializer(user, null).render({}, { casing: 'snake' })).toEqual({
        email: 'abc',
        phone_number: null,
        fax_number: null,
      })
    })

    it('renders null for the keys an anyOf member’s serializer requires whichever order the members are declared in, when another member flattens that serializer with `required: false`', () => {
      interface Keyed {
        optionalPathKey?: string
        sharedKey?: string
        renderedKey?: string
      }

      const SharedSerializer = (data: Keyed) =>
        ObjectSerializer(data).attribute('sharedKey', { openapi: 'string' })
      const RenderedSerializer = (data: Keyed) =>
        ObjectSerializer(data).attribute('renderedKey', { openapi: 'string' })
      const OptionalPathSerializer = (data: Keyed) =>
        ObjectSerializer(data)
          .attribute('optionalPathKey', { openapi: 'string' })
          .customAttribute('shared', () => undefined, {
            flatten: true,
            required: false,
            openapi: { $serializer: SharedSerializer },
          })

      const optionalPathFirst: OpenapiSchemaBodyShorthand = {
        anyOf: [
          { $serializer: OptionalPathSerializer },
          { $serializer: SharedSerializer },
          { $serializer: RenderedSerializer },
        ],
      }
      const sharedFirst: OpenapiSchemaBodyShorthand = {
        anyOf: [
          { $serializer: SharedSerializer },
          { $serializer: OptionalPathSerializer },
          { $serializer: RenderedSerializer },
        ],
      }

      ;[optionalPathFirst, sharedFirst].forEach(openapi => {
        const PresentSerializer = (user: User) =>
          ObjectSerializer(user).customAttribute('details', () => RenderedSerializer({ renderedKey: 'x' }), {
            flatten: true,
            openapi,
          })
        const NullSerializer = (user: User) =>
          ObjectSerializer(user).customAttribute('details', () => null, { flatten: true, openapi })

        expect(PresentSerializer({ email: 'abc', password: '123' }).render()).toEqual({
          optionalPathKey: null,
          sharedKey: null,
          renderedKey: 'x',
        })
        expect(NullSerializer({ email: 'abc', password: '123' }).render()).toEqual({
          optionalPathKey: null,
          sharedKey: null,
          renderedKey: null,
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
      const ReturnedMemberSerializer = (data: { returnedKey: string } | null) =>
        ObjectSerializer(data).attribute('returnedKey', { openapi: 'string' })
      const OtherMemberSerializer = (data: { otherKey: string } | null) =>
        ObjectSerializer(data).attribute('otherKey', { openapi: 'string' })

      const openapi: OpenapiSchemaBodyShorthand = {
        anyOf: [
          { $serializer: ReturnedMemberSerializer },
          { $serializer: OtherMemberSerializer },
          { type: 'null' },
        ],
      }

      const WrappedSerializer = (user: User) =>
        ObjectSerializer(user).customAttribute('details', () => ReturnedMemberSerializer(null), {
          flatten: true,
          openapi,
        })
      const NullSerializer = (user: User) =>
        ObjectSerializer(user).customAttribute('details', () => null, { flatten: true, openapi })

      const user: User = { email: 'abc', password: '123' }

      expect(WrappedSerializer(user).render()).toEqual({ returnedKey: null, otherKey: null })
      expect(WrappedSerializer(user).render()).toEqual(NullSerializer(user).render())
    })

    it('renders null for every key any oneOf member requires that a returned plain object leaves out, whichever order the members are declared in', () => {
      const matchedMember: OpenapiSchemaBodyShorthand = {
        type: 'object',
        properties: { kind: 'string', a: 'string' },
        required: ['kind'],
      }
      const otherMember: OpenapiSchemaBodyShorthand = {
        type: 'object',
        properties: { kind: 'string', a: 'string', b: 'string' },
        required: ['kind', 'a', 'b'],
      }

      ;[{ oneOf: [matchedMember, otherMember] }, { oneOf: [otherMember, matchedMember] }].forEach(openapi => {
        const MySerializer = (user: User) =>
          ObjectSerializer(user).customAttribute('details', () => ({ kind: 'one' }), {
            flatten: true,
            openapi,
          })

        const rendered = MySerializer({ email: 'abc', password: '123' }).render()

        expect(rendered).toEqual({ kind: 'one', a: null, b: null })
        expect(rendered).toEqual({ ...nullFlattenedOpenapiKeys(openapi), kind: 'one' })
      })
    })

    it('renders null for a key the member a returned plain object matches leaves optional and another member requires', () => {
      const MySerializer = (user: User) =>
        ObjectSerializer(user).customAttribute('details', () => ({ aKey: '1' }), {
          flatten: true,
          openapi: {
            anyOf: [
              { type: 'object', properties: { aKey: 'string', extraKey: 'string' }, required: ['aKey'] },
              {
                type: 'object',
                properties: { bKey: 'string', extraKey: 'string' },
                required: ['bKey', 'extraKey'],
              },
            ],
          },
        })

      const user: User = { email: 'abc', password: '123' }

      expect(MySerializer(user).render()).toEqual({ aKey: '1', bKey: null, extraKey: null })
      expect(MySerializer(user).render({}, { casing: 'snake' })).toEqual({
        a_key: '1',
        b_key: null,
        extra_key: null,
      })
    })

    it('renders null for a key a returned serializer declares with `required: false` that another member requires', () => {
      interface Keyed {
        aKey?: string
        bKey?: string
        extraKey?: string
      }

      const ASerializer = (data: Keyed) =>
        ObjectSerializer(data)
          .attribute('aKey', { openapi: 'string' })
          .attribute('extraKey', { openapi: 'string', required: false })
      const BSerializer = (data: Keyed) =>
        ObjectSerializer(data)
          .attribute('bKey', { openapi: 'string' })
          .attribute('extraKey', { openapi: 'string' })

      const MySerializer = (user: User) =>
        ObjectSerializer(user).customAttribute('details', () => ASerializer({ aKey: '1' }), {
          flatten: true,
          openapi: { anyOf: [{ $serializer: ASerializer }, { $serializer: BSerializer }] },
        })

      expect(MySerializer({ email: 'abc', password: '123' }).render()).toEqual({
        aKey: '1',
        bKey: null,
        extraKey: null,
      })
    })

    it('leaves out a key no member requires when the returned value does not supply it', () => {
      const MySerializer = (user: User) =>
        ObjectSerializer(user).customAttribute('details', () => ({ aKey: '1' }), {
          flatten: true,
          openapi: {
            anyOf: [
              { type: 'object', properties: { aKey: 'string', note: 'string' }, required: ['aKey'] },
              { type: 'object', properties: { bKey: 'string', note: 'string' }, required: ['bKey'] },
            ],
          },
        })

      expect(MySerializer({ email: 'abc', password: '123' }).render()).toEqual({ aKey: '1', bKey: null })
    })

    it('renders none of its keys when the callback returns undefined with `required: false`', () => {
      const MySerializer = (user: User) =>
        ObjectSerializer(user)
          .attribute('email', { openapi: 'string' })
          .customAttribute('details', () => undefined, {
            flatten: true,
            required: false,
            openapi: {
              anyOf: [
                { type: 'object', properties: { aKey: 'string' }, required: ['aKey'] },
                { type: 'object', properties: { bKey: 'string' }, required: ['bKey'] },
              ],
            },
          })

      expect(MySerializer({ email: 'abc', password: '123' }).render()).toEqual({ email: 'abc' })
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
        ...nullFlattenedOpenapiKeys({ $serializable: Balloon }),
        color: 'red',
      })
    })

    it('renders null for the keys another STI child requires beside a plain object returned for a $serializable ref that is an anyOf member, as beside the child’s serializer', () => {
      const latex = Latex.new({ color: 'red' })
      const openapi: OpenapiSchemaBodyShorthand = { anyOf: [{ $serializable: Balloon }, { type: 'null' }] }

      const PlainSerializer = (user: User) =>
        ObjectSerializer(user).customAttribute('balloon', () => LatexSerializer(latex).render(), {
          flatten: true,
          openapi,
        })
      const WrappedSerializer = (user: User) =>
        ObjectSerializer(user).customAttribute('balloon', () => LatexSerializer(latex), {
          flatten: true,
          openapi,
        })

      const user: User = { email: 'abc', password: '123' }

      expect(PlainSerializer(user).render()).toEqual({ color: 'red', mylarOnlyProperty: null })
      expect(PlainSerializer(user).render()).toEqual(WrappedSerializer(user).render())
      expect(PlainSerializer(user).render()).toEqual({ ...nullFlattenedOpenapiKeys(openapi), color: 'red' })
    })

    it('renders null for the keys every other member of a nested anyOf requires beside a plain object one of its members declares', () => {
      const openapi: OpenapiSchemaBodyShorthand = {
        anyOf: [
          {
            anyOf: [
              { type: 'object', properties: { aKey: 'string' }, required: ['aKey'] },
              { type: 'object', properties: { bKey: 'string' }, required: ['bKey'] },
            ],
          },
          { type: 'object', properties: { cKey: 'string' }, required: ['cKey'] },
        ],
      }

      const MySerializer = (user: User) =>
        ObjectSerializer(user).customAttribute('details', () => ({ aKey: '1' }), {
          flatten: true,
          openapi,
        })

      const rendered = MySerializer({ email: 'abc', password: '123' }).render()

      expect(rendered).toEqual({ aKey: '1', bKey: null, cKey: null })
      expect(rendered).toEqual({ ...nullFlattenedOpenapiKeys(openapi), aKey: '1' })
    })

    it('renders null for every key a nested anyOf or oneOf member, its sibling or the allOf beside it requires that a returned plain object leaves out', () => {
      const base: OpenapiSchemaBodyShorthand = {
        type: 'object',
        properties: { common: 'string' },
        required: ['common'],
      }
      const matchedMember: OpenapiSchemaBodyShorthand = {
        type: 'object',
        properties: { aKey: 'string', x: 'string' },
        required: ['aKey'],
      }
      const otherMember: OpenapiSchemaBodyShorthand = {
        type: 'object',
        properties: { bKey: 'string' },
        required: ['bKey'],
      }
      const outerMember: OpenapiSchemaBodyShorthand = {
        type: 'object',
        properties: { cKey: 'string', x: 'string' },
        required: ['cKey', 'x'],
      }

      const openapis = [
        { anyOf: [{ allOf: [base], anyOf: [matchedMember, otherMember] }, outerMember] },
        { oneOf: [{ allOf: [base], oneOf: [matchedMember, otherMember] }, outerMember] },
      ]
      openapis.forEach(openapi => {
        const MySerializer = (user: User) =>
          ObjectSerializer(user).customAttribute('details', () => ({ common: 'c', aKey: '1' }), {
            flatten: true,
            openapi,
          })

        const rendered = MySerializer({ email: 'abc', password: '123' }).render()

        expect(rendered).toEqual({ common: 'c', aKey: '1', bKey: null, cKey: null, x: null })
        expect(rendered).toEqual({ ...nullFlattenedOpenapiKeys(openapi), common: 'c', aKey: '1' })
      })
    })

    it('renders null for a key the allOf beside an anyOf requires, or another anyOf member requires, that a returned plain object leaves out', () => {
      const base: OpenapiSchemaBodyShorthand = {
        type: 'object',
        properties: { common: 'string' },
        required: ['common'],
      }
      const aMember: OpenapiSchemaBodyShorthand = {
        type: 'object',
        properties: { aKey: 'string', x: 'string' },
        required: ['aKey'],
      }
      const bMember: OpenapiSchemaBodyShorthand = {
        type: 'object',
        properties: { bKey: 'string', x: 'string' },
        required: ['bKey', 'x'],
      }
      const openapi = { allOf: [base], anyOf: [aMember, bMember] }

      const MySerializer = (user: User) =>
        ObjectSerializer(user).customAttribute('details', () => ({ aKey: '1' }), {
          flatten: true,
          openapi,
        })

      const rendered = MySerializer({ email: 'abc', password: '123' }).render()

      expect(rendered).toEqual({ common: null, aKey: '1', bKey: null, x: null })
      expect(rendered).toEqual({ ...nullFlattenedOpenapiKeys(openapi), aKey: '1' })
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
