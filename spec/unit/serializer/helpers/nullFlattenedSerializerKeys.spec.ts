import DreamApp from '../../../../src/dream-app/index.js'
import ObjectSerializer from '../../../../src/serializer/ObjectSerializer.js'
import {
  flattenedOpenapiVariants,
  nullFlattenedOpenapiKeys,
  nullFlattenedOpenapiKeysOfOtherVariants,
  nullFlattenedOpenapiKeysForValue,
  nullFlattenedSerializerKeys,
  nullFlattenedSerializerKeysOfOtherVariants,
} from '../../../../src/serializer/helpers/nullFlattenedSerializerKeys.js'
import { OpenapiSchemaBodyShorthand } from '../../../../src/types/openapi.js'
import { SimpleObjectSerializerType } from '../../../../src/types/serializer.js'
import Balloon from '../../../../test-app/app/models/Balloon.js'
import Latex from '../../../../test-app/app/models/Balloon/Latex.js'
import LatexSerializer from '../../../../test-app/app/serializers/Balloon/LatexSerializer.js'

interface Address {
  city: string
}

interface Contact {
  emailAddress: string
  address: Address
  addresses: Address[]
}

const AddressSerializer = (address: Address) =>
  ObjectSerializer(address).attribute('city', { openapi: 'string' })

describe('nullFlattenedSerializerKeys', () => {
  it('is reachable through DreamApp.system', () => {
    expect(DreamApp.system.nullFlattenedSerializerKeys).toBe(nullFlattenedSerializerKeys)
  })

  it('returns null for every key a serializer declares, without running its callbacks', () => {
    const ContactSerializer = (contact: Contact) =>
      ObjectSerializer(contact)
        .attribute('emailAddress', { as: 'email', openapi: 'string' })
        .customAttribute('emailLength', () => contact.emailAddress.length, { openapi: 'integer' })
        .delegatedAttribute('address', 'city', { openapi: 'string' })
        .rendersOne('address', { serializer: AddressSerializer })
        .rendersMany('addresses', { serializer: AddressSerializer })

    expect(nullFlattenedSerializerKeys([ContactSerializer])).toEqual({
      email: null,
      emailLength: null,
      city: null,
      address: null,
      addresses: null,
    })
  })

  it('adds the keys of a flattened rendersOne’s serializer', () => {
    const ContactSerializer = (contact: Contact) =>
      ObjectSerializer(contact)
        .attribute('emailAddress', { openapi: 'string' })
        .rendersOne('address', { serializer: AddressSerializer, flatten: true })

    expect(nullFlattenedSerializerKeys([ContactSerializer])).toEqual({ emailAddress: null, city: null })
  })

  it('leaves out a key a serializer declares with `required: false`', () => {
    const ContactSerializer = (contact: Contact) =>
      ObjectSerializer(contact)
        .attribute('emailAddress', { openapi: 'string', required: false })
        .delegatedAttribute('address', 'city', { openapi: 'string', required: false })
        .customAttribute('emailLength', () => contact.emailAddress.length, {
          openapi: 'integer',
          required: false,
        })
        .rendersOne('address', { serializer: AddressSerializer })

    expect(nullFlattenedSerializerKeys([ContactSerializer])).toEqual({ address: null })
  })

  context('a flattened customAttribute', () => {
    it('adds each key of its openapi properties that the `required` array lists', () => {
      const ContactSerializer = (contact: Contact) =>
        ObjectSerializer(contact).customAttribute('phone', () => ({ phoneNumber: '555-1234' }), {
          flatten: true,
          openapi: {
            type: 'object',
            properties: { phoneNumber: 'string', extension: 'string' },
            required: ['phoneNumber'],
          },
        })

      expect(nullFlattenedSerializerKeys([ContactSerializer])).toEqual({ phoneNumber: null })
    })

    it('adds none of its keys when it is `required: false`', () => {
      const ContactSerializer = (contact: Contact) =>
        ObjectSerializer(contact).customAttribute('address', () => undefined, {
          flatten: true,
          required: false,
          openapi: { $serializer: AddressSerializer },
        })

      expect(nullFlattenedSerializerKeys([ContactSerializer])).toEqual({})
    })

    it('adds the keys of the serializer a $serializer ref names', () => {
      const ContactSerializer = (contact: Contact) =>
        ObjectSerializer(contact).customAttribute('address', () => AddressSerializer(contact.address), {
          flatten: true,
          openapi: { $serializer: AddressSerializer },
        })

      expect(nullFlattenedSerializerKeys([ContactSerializer])).toEqual({ city: null })
    })

    it('adds the keys of every STI child serializer a $serializable ref resolves to', () => {
      const ContactSerializer = (contact: Contact) =>
        ObjectSerializer(contact).customAttribute('balloon', () => null, {
          flatten: true,
          openapi: { $serializable: Balloon, key: 'stiUnion' },
        })

      expect(nullFlattenedSerializerKeys([ContactSerializer])).toEqual({
        color: null,
        multicolor: null,
        mylarOnlyProperty: null,
        sandbags: null,
        heartRatings: null,
        material: null,
        balloonLine: null,
      })
    })

    it('adds the union of the keys every member of an anyOf, oneOf or allOf requires', () => {
      const ContactSerializer = (contact: Contact) =>
        ObjectSerializer(contact).customAttribute('details', () => null, {
          flatten: true,
          openapi: {
            anyOf: [
              { type: 'object', properties: { phoneNumber: 'string' }, required: ['phoneNumber'] },
              { $serializer: AddressSerializer },
              {
                oneOf: [
                  { type: 'object', properties: { fax: 'string' } },
                  { allOf: [{ type: 'object', properties: { pager: 'string' }, required: ['pager'] }] },
                ],
              },
              { type: 'null' },
            ],
          },
        })

      expect(nullFlattenedSerializerKeys([ContactSerializer])).toEqual({
        phoneNumber: null,
        city: null,
        pager: null,
      })
    })

    it('adds a key an object shape’s own `required` array lists beside the allOf member that declares it', () => {
      const ContactSerializer = (contact: Contact) =>
        ObjectSerializer(contact).customAttribute('details', () => null, {
          flatten: true,
          openapi: {
            type: 'object',
            required: ['kind'],
            allOf: [{ type: 'object', properties: { kind: 'string', label: 'string' } }],
          },
        })

      expect(nullFlattenedSerializerKeys([ContactSerializer])).toEqual({ kind: null })
    })

    it('adds no keys for a many ref', () => {
      const ContactSerializer = (contact: Contact) =>
        ObjectSerializer(contact).customAttribute('addresses', () => null, {
          flatten: true,
          openapi: { anyOf: [{ $serializer: AddressSerializer, many: true }, { type: 'null' }] },
        })

      expect(nullFlattenedSerializerKeys([ContactSerializer])).toEqual({})
    })
  })

  it('cases each key a serializer declares and each openapi properties key per the casing option', () => {
    const ContactSerializer = (contact: Contact) =>
      ObjectSerializer(contact)
        .attribute('emailAddress', { openapi: 'string' })
        .customAttribute('phone', () => null, {
          flatten: true,
          openapi: { type: 'object', properties: { phoneNumber: 'string' }, required: ['phoneNumber'] },
        })

    expect(nullFlattenedSerializerKeys([ContactSerializer], { casing: 'snake' })).toEqual({
      email_address: null,
      phone_number: null,
    })
  })

  it('passes the passthrough data to each serializer it builds', () => {
    const ContactSerializer = (contact: Contact, passthroughData: { locale: string }) =>
      ObjectSerializer(contact, passthroughData).attribute('emailAddress', {
        as: `email_${passthroughData.locale}`,
        openapi: 'string',
      })

    expect(nullFlattenedSerializerKeys([ContactSerializer], { passthroughData: { locale: 'en' } })).toEqual({
      email_en: null,
    })
  })

  it('terminates on a serializer that flattens itself, adding its keys once', () => {
    interface Node {
      label: string
      parent: Node | null
    }

    const NodeSerializer: SimpleObjectSerializerType = (node: Node) =>
      ObjectSerializer(node)
        .attribute('label', { openapi: 'string' })
        .rendersOne('parent', { serializer: NodeSerializer, flatten: true })
        .customAttribute('sibling', () => null, { flatten: true, openapi: { $serializer: NodeSerializer } })

    expect(nullFlattenedSerializerKeys([NodeSerializer])).toEqual({ label: null })
  })
})

describe('nullFlattenedOpenapiKeys', () => {
  it('is reachable through DreamApp.system', () => {
    expect(DreamApp.system.nullFlattenedOpenapiKeys).toBe(nullFlattenedOpenapiKeys)
  })

  it('returns exactly the keys a flattened customAttribute with this openapi renders as null for a null value', () => {
    const OptionalCitySerializer = (address: Address) =>
      ObjectSerializer(address).attribute('city', { openapi: 'string', required: false })

    const openapi: OpenapiSchemaBodyShorthand = {
      anyOf: [
        {
          type: 'object',
          properties: { phoneNumber: 'string', extension: 'string' },
          required: ['phoneNumber'],
        },
        { $serializer: AddressSerializer },
        { $serializer: OptionalCitySerializer },
        { type: 'null' },
      ],
    }

    const ContactSerializer = (contact: Contact) =>
      ObjectSerializer(contact).customAttribute('details', () => null, { flatten: true, openapi })

    expect(nullFlattenedOpenapiKeys(openapi)).toEqual({ phoneNumber: null, city: null })
    expect(nullFlattenedOpenapiKeys(openapi)).toEqual(
      ContactSerializer({ emailAddress: 'a', address: { city: 'b' }, addresses: [] }).render()
    )
    expect(nullFlattenedOpenapiKeys(openapi, { casing: 'snake' })).toEqual({ phone_number: null, city: null })
  })

  it('returns nothing for a shape whose `required` array lists none of its keys', () => {
    expect(nullFlattenedOpenapiKeys({ type: 'object', properties: { phoneNumber: 'string' } })).toEqual({})
  })
})

describe('nullFlattenedSerializerKeysOfOtherVariants', () => {
  interface Pet {
    name: string
    lives?: number
    barks?: boolean
    sound?: string
  }

  const CatSerializer = (pet: Pet) =>
    ObjectSerializer(pet)
      .attribute('name', { openapi: 'string' })
      .attribute('lives', { openapi: 'integer' })
      .attribute('sound', { openapi: 'string', required: false })

  const DogSerializer = (pet: Pet) =>
    ObjectSerializer(pet)
      .attribute('name', { openapi: 'string' })
      .attribute('barks', { openapi: 'boolean' })
      .attribute('sound', { openapi: 'string' })

  it('returns null for each key another serializer requires that the rendered one does not declare', () => {
    expect(nullFlattenedSerializerKeysOfOtherVariants([CatSerializer, DogSerializer], CatSerializer)).toEqual(
      {
        barks: null,
      }
    )
  })

  it('leaves out a key every other serializer declaring it marks `required: false`', () => {
    expect(nullFlattenedSerializerKeysOfOtherVariants([CatSerializer, DogSerializer], DogSerializer)).toEqual(
      {
        lives: null,
      }
    )
  })

  it('returns nothing when the rendered serializer is the only one', () => {
    expect(nullFlattenedSerializerKeysOfOtherVariants([CatSerializer], CatSerializer)).toEqual({})
  })
})

describe('nullFlattenedOpenapiKeysOfOtherVariants', () => {
  const AddressSerializer = (address: { city: string }) =>
    ObjectSerializer(address).attribute('city', { openapi: 'string' })

  const phoneMember: OpenapiSchemaBodyShorthand = {
    type: 'object',
    properties: { phoneNumber: 'string', extension: 'string' },
    required: ['phoneNumber'],
  }
  const faxMember: OpenapiSchemaBodyShorthand = { type: 'object', properties: { fax: 'string' } }
  const addressMember: OpenapiSchemaBodyShorthand = { $serializer: AddressSerializer }
  const openapi: OpenapiSchemaBodyShorthand = {
    anyOf: [phoneMember, faxMember, addressMember, { type: 'null' }],
  }

  it('is reachable through DreamApp.system, beside nullFlattenedSerializerKeysOfOtherVariants', () => {
    expect(DreamApp.system.nullFlattenedOpenapiKeysOfOtherVariants).toBe(
      nullFlattenedOpenapiKeysOfOtherVariants
    )
    expect(DreamApp.system.nullFlattenedSerializerKeysOfOtherVariants).toBe(
      nullFlattenedSerializerKeysOfOtherVariants
    )
  })

  it('returns null for each key another member requires that the rendered member does not declare', () => {
    expect(nullFlattenedOpenapiKeysOfOtherVariants(openapi, phoneMember)).toEqual({ city: null })
    expect(nullFlattenedOpenapiKeysOfOtherVariants(openapi, faxMember)).toEqual({
      phoneNumber: null,
      city: null,
    })
    expect(nullFlattenedOpenapiKeysOfOtherVariants(openapi, addressMember)).toEqual({ phoneNumber: null })
  })

  it('takes a $serializer ref to one STI child as the rendered variant of a $serializable ref to the base', () => {
    expect(
      nullFlattenedOpenapiKeysOfOtherVariants({ $serializable: Balloon }, { $serializer: LatexSerializer })
    ).toEqual({ mylarOnlyProperty: null })
  })

  it('leaves out every key any member of a combination of anyOf members declares', () => {
    const a: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { aKey: 'string', extension: 'string' },
      required: ['aKey'],
    }
    const b: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { bKey: 'string' },
      required: ['bKey'],
    }
    const c: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { cKey: 'string', extension: 'string' },
      required: ['cKey', 'extension'],
    }

    expect(nullFlattenedOpenapiKeysOfOtherVariants({ anyOf: [a, b, c] }, { allOf: [a, b] })).toEqual({
      cKey: null,
    })
    expect(nullFlattenedOpenapiKeysOfOtherVariants({ anyOf: [a, b, c] }, { allOf: [b, c] })).toEqual({
      aKey: null,
    })
  })
})

describe('nullFlattenedOpenapiKeysForValue', () => {
  it('reads a returned serializer’s declarations as the rendered variant, so a $serializable STI ref adds the other children’s keys', () => {
    expect(
      nullFlattenedOpenapiKeysForValue(
        { $serializable: Balloon },
        LatexSerializer(Latex.new({ color: 'red' }))
      )
    ).toEqual({ mylarOnlyProperty: null })
  })

  it('adds each key an openapi with a single shape requires that a returned plain object leaves out, but not its optional keys', () => {
    expect(
      nullFlattenedOpenapiKeysForValue(
        {
          type: 'object',
          properties: { a: 'string', b: 'string', c: 'string' },
          required: ['a', 'b'],
        },
        { a: 'x' }
      )
    ).toEqual({ b: null })
  })

  it('adds each key the rendered member requires that a returned plain object leaves out, beside the other members’ keys', () => {
    expect(
      nullFlattenedOpenapiKeysForValue(
        {
          anyOf: [
            {
              type: 'object',
              properties: { phoneNumber: 'string', extension: 'string' },
              required: ['phoneNumber', 'extension'],
            },
            { type: 'object', properties: { faxNumber: 'string' }, required: ['faxNumber'] },
          ],
        },
        { phoneNumber: '555' }
      )
    ).toEqual({ extension: null, faxNumber: null })
  })

  it('compares a returned object’s keys with openapi properties keys in the render’s casing', () => {
    expect(
      nullFlattenedOpenapiKeysForValue(
        {
          anyOf: [
            { type: 'object', properties: { phoneNumber: 'string' }, required: ['phoneNumber'] },
            { type: 'object', properties: { faxNumber: 'string' }, required: ['faxNumber'] },
          ],
        },
        { phoneNumber: '555' },
        { casing: 'snake' }
      )
    ).toEqual({ fax_number: null })
  })

  it('reads a plain object as the one member declaring every key it has, so that member’s omitted optional keys stay absent', () => {
    // this returns only the keys to add as null beside the object, never a key the object has; the
    // renderer spreads this result and then the object, so the render is
    // { fax: null, phoneNumber: '555' }:
    //   1. the phone member is the only one declaring every key the object has (`phoneNumber`),
    //      so it is the rendered member
    //   2. the rendered member's own required keys add nothing: its only one, `phoneNumber`, is
    //      in the object
    //   3. the fax member requires `fax` and `extension`; the phone member does not declare `fax`,
    //      so it is added as null, but it declares `extension` (as optional), so that is not added
    expect(
      nullFlattenedOpenapiKeysForValue(
        {
          oneOf: [
            {
              type: 'object',
              properties: { phoneNumber: 'string', extension: 'string' },
              required: ['phoneNumber'],
            },
            {
              type: 'object',
              properties: { fax: 'string', extension: 'string' },
              required: ['fax', 'extension'],
            },
          ],
        },
        { phoneNumber: '555' }
      )
    ).toEqual({ fax: null })
  })
  it('reads a plain object as the pairing of the anyOf member and the oneOf member declaring its keys, adding the keys the other members require', () => {
    expect(
      nullFlattenedOpenapiKeysForValue(
        {
          anyOf: [
            { type: 'object', properties: { aKey: 'string' }, required: ['aKey'] },
            { type: 'object', properties: { bKey: 'string' }, required: ['bKey'] },
          ],
          oneOf: [
            { type: 'object', properties: { cKey: 'string', extension: 'string' }, required: ['cKey'] },
            {
              type: 'object',
              properties: { dKey: 'string', extension: 'string' },
              required: ['dKey', 'extension'],
            },
          ],
        },
        { aKey: '1', cKey: '2' }
      )
    ).toEqual({ bKey: null, dKey: null })
  })

  it('reads a plain object that has the required keys of several anyOf members as their combination, adding nothing when it has every key they require', () => {
    expect(
      nullFlattenedOpenapiKeysForValue(
        {
          anyOf: [
            { type: 'object', properties: { aKey: 'string' }, required: ['aKey'] },
            { type: 'object', properties: { bKey: 'string' }, required: ['bKey'] },
          ],
        },
        { aKey: '1', bKey: '2' }
      )
    ).toEqual({})
  })

  it('reads a plain object that has the required keys of several anyOf members as their combination, so a key one of them declares optional stays absent though an unmatched member requires it', () => {
    const a: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { aKey: 'string', extension: 'string' },
      required: ['aKey'],
    }
    const b: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { bKey: 'string' },
      required: ['bKey'],
    }
    const c: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { cKey: 'string', extension: 'string' },
      required: ['cKey', 'extension'],
    }

    expect(nullFlattenedOpenapiKeysForValue({ anyOf: [a, b, c] }, { aKey: '1', bKey: '2' })).toEqual({
      cKey: null,
    })
  })

  it('reads a plain object as the combination of the anyOf members whose required keys it has, joined with the allOf beside them and paired with the oneOf member declaring its keys', () => {
    const shared: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { id: 'string' },
      required: ['id'],
    }
    const a: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { aKey: 'string' },
      required: ['aKey'],
    }
    const b: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { bKey: 'string' },
      required: ['bKey'],
    }
    const c: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { cKey: 'string', extension: 'string' },
      required: ['cKey'],
    }
    const d: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { dKey: 'string', extension: 'string' },
      required: ['dKey', 'extension'],
    }

    expect(
      nullFlattenedOpenapiKeysForValue(
        { allOf: [shared], anyOf: [a, b], oneOf: [c, d] },
        { aKey: '1', bKey: '2', cKey: '3' }
      )
    ).toEqual({ id: null, dKey: null })
  })
})

describe('flattenedOpenapiVariants', () => {
  it('is reachable through DreamApp.system', () => {
    expect(DreamApp.system.flattenedOpenapiVariants).toBe(flattenedOpenapiVariants)
  })

  it('returns a $serializer ref to each child a $serializable ref to an STI base resolves to', () => {
    expect(flattenedOpenapiVariants({ $serializable: Balloon })).toEqual(
      expect.arrayContaining([{ $serializer: LatexSerializer }])
    )
    expect(flattenedOpenapiVariants({ $serializable: Balloon }).length).toBeGreaterThan(1)
  })

  it('returns the members of an anyOf or oneOf, a member with several variants contributing them in its place, each joined with the allOf beside it', () => {
    const shared: OpenapiSchemaBodyShorthand = { type: 'object', properties: { id: 'string' } }
    const phone: OpenapiSchemaBodyShorthand = { type: 'object', properties: { phoneNumber: 'string' } }
    const fax: OpenapiSchemaBodyShorthand = { type: 'object', properties: { fax: 'string' } }
    const email: OpenapiSchemaBodyShorthand = { type: 'object', properties: { email: 'string' } }

    expect(flattenedOpenapiVariants({ allOf: [shared], anyOf: [phone, { oneOf: [fax, email] }] })).toEqual([
      { allOf: [shared, phone] },
      { allOf: [shared, fax] },
      { allOf: [shared, email] },
    ])
  })

  it('returns each anyOf member, then each combination of two or more of its object members by size and then member order', () => {
    const a: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { aKey: 'string' },
      required: ['aKey'],
    }
    const b: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { bKey: 'string' },
      required: ['bKey'],
    }
    const c: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { cKey: 'string' },
      required: ['cKey'],
    }

    expect(flattenedOpenapiVariants({ anyOf: [a, b] })).toEqual([a, b, { allOf: [a, b] }])
    expect(flattenedOpenapiVariants({ anyOf: [a, b, c] })).toEqual([
      a,
      b,
      c,
      { allOf: [a, b] },
      { allOf: [a, c] },
      { allOf: [b, c] },
      { allOf: [a, b, c] },
    ])
  })

  it('combines no anyOf member that is a serializer ref, a primitive, or has several variants of its own', () => {
    const a: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { aKey: 'string' },
      required: ['aKey'],
    }
    const b: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { bKey: 'string' },
      required: ['bKey'],
    }
    const c: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { cKey: 'string' },
      required: ['cKey'],
    }
    const d: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { dKey: 'string' },
      required: ['dKey'],
    }
    const serializerRef: OpenapiSchemaBodyShorthand = { $serializer: AddressSerializer }

    expect(
      flattenedOpenapiVariants({ anyOf: [a, serializerRef, { type: 'null' }, { oneOf: [c, d] }, b] })
    ).toEqual([a, serializerRef, { type: 'null' }, c, d, b, { allOf: [a, b] }])
  })

  it('returns one variant per pairing of an anyOf variant, a combination of anyOf members included, with a oneOf variant beside it', () => {
    const a: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { aKey: 'string' },
      required: ['aKey'],
    }
    const b: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { bKey: 'string' },
      required: ['bKey'],
    }
    const c: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { cKey: 'string' },
      required: ['cKey'],
    }
    const d: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { dKey: 'string' },
      required: ['dKey'],
    }

    expect(flattenedOpenapiVariants({ anyOf: [a, b], oneOf: [c, d] })).toEqual([
      { allOf: [a, c] },
      { allOf: [a, d] },
      { allOf: [b, c] },
      { allOf: [b, d] },
      { allOf: [{ allOf: [a, b] }, c] },
      { allOf: [{ allOf: [a, b] }, d] },
    ])
  })

  it('joins each pairing of an anyOf variant with a oneOf variant with the allOf beside them, a member with several variants contributing them in its place', () => {
    const shared: OpenapiSchemaBodyShorthand = { type: 'object', properties: { id: 'string' } }
    const a: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { aKey: 'string' },
      required: ['aKey'],
    }
    const b: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { bKey: 'string' },
      required: ['bKey'],
    }
    const c: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { cKey: 'string' },
      required: ['cKey'],
    }
    const d: OpenapiSchemaBodyShorthand = {
      type: 'object',
      properties: { dKey: 'string' },
      required: ['dKey'],
    }

    expect(flattenedOpenapiVariants({ allOf: [shared], anyOf: [{ anyOf: [a, b] }], oneOf: [c, d] })).toEqual([
      { allOf: [shared, a, c] },
      { allOf: [shared, a, d] },
      { allOf: [shared, b, c] },
      { allOf: [shared, b, d] },
      { allOf: [shared, { allOf: [a, b] }, c] },
      { allOf: [shared, { allOf: [a, b] }, d] },
    ])
  })

  it('returns no variants for a single shape, a ref with `many: true`, or a primitive', () => {
    expect(flattenedOpenapiVariants({ type: 'object', properties: { a: 'string' } })).toEqual([])
    expect(flattenedOpenapiVariants({ $serializable: Balloon, many: true })).toEqual([])
    expect(flattenedOpenapiVariants('string')).toEqual([])
  })
})
