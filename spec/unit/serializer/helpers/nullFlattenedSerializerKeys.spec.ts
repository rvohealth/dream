import DreamApp from '../../../../src/dream-app/index.js'
import ObjectSerializer from '../../../../src/serializer/ObjectSerializer.js'
import {
  nullFlattenedOpenapiKeysOfOtherVariants,
  nullFlattenedOpenapiKeysOfOtherVariantsForValue,
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

  context('a flattened customAttribute', () => {
    it('adds every key of its openapi properties', () => {
      const ContactSerializer = (contact: Contact) =>
        ObjectSerializer(contact).customAttribute('phone', () => ({ phoneNumber: '555-1234' }), {
          flatten: true,
          openapi: { type: 'object', properties: { phoneNumber: 'string', extension: 'string' } },
        })

      expect(nullFlattenedSerializerKeys([ContactSerializer])).toEqual({ phoneNumber: null, extension: null })
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

    it('adds the union of the keys of every member of an anyOf, oneOf or allOf', () => {
      const ContactSerializer = (contact: Contact) =>
        ObjectSerializer(contact).customAttribute('details', () => null, {
          flatten: true,
          openapi: {
            anyOf: [
              { type: 'object', properties: { phoneNumber: 'string' } },
              { $serializer: AddressSerializer },
              {
                oneOf: [
                  { type: 'object', properties: { fax: 'string' } },
                  { allOf: [{ type: 'object', properties: { pager: 'string' } }] },
                ],
              },
              { type: 'null' },
            ],
          },
        })

      expect(nullFlattenedSerializerKeys([ContactSerializer])).toEqual({
        phoneNumber: null,
        city: null,
        fax: null,
        pager: null,
      })
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

  it('cases every key per the casing option', () => {
    const ContactSerializer = (contact: Contact) =>
      ObjectSerializer(contact)
        .attribute('emailAddress', { openapi: 'string' })
        .customAttribute('phone', () => null, {
          flatten: true,
          openapi: { type: 'object', properties: { phoneNumber: 'string' } },
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
})

describe('nullFlattenedOpenapiKeysOfOtherVariantsForValue', () => {
  it('reads a returned serializer’s declarations as the rendered variant, so a $serializable STI ref adds the other children’s keys', () => {
    expect(
      nullFlattenedOpenapiKeysOfOtherVariantsForValue(
        { $serializable: Balloon },
        LatexSerializer(Latex.new({ color: 'red' }))
      )
    ).toEqual({ mylarOnlyProperty: null })
  })

  it('returns nothing for a plain object returned for an openapi with a single shape', () => {
    expect(
      nullFlattenedOpenapiKeysOfOtherVariantsForValue(
        { type: 'object', properties: { a: 'string', b: 'string' }, required: ['a', 'b'] },
        { a: 'x' }
      )
    ).toEqual({})
  })

  it('compares a returned object’s keys in the render’s casing', () => {
    expect(
      nullFlattenedOpenapiKeysOfOtherVariantsForValue(
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
    // `extension` is optional in the phone member and required in the fax member; a phone-shaped
    // value without it renders the phone member, which declares it, so it is not filled
    expect(
      nullFlattenedOpenapiKeysOfOtherVariantsForValue(
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
})
