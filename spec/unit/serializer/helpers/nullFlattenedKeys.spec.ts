import DreamApp from '../../../../src/dream-app/index.js'
import ObjectSerializer from '../../../../src/serializer/ObjectSerializer.js'
import { nullFlattenedKeys } from '../../../../src/serializer/helpers/nullFlattenedKeys.js'
import { SimpleObjectSerializerType } from '../../../../src/types/serializer.js'
import Balloon from '../../../../test-app/app/models/Balloon.js'

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

describe('nullFlattenedKeys', () => {
  it('is reachable through DreamApp.system', () => {
    expect(DreamApp.system.nullFlattenedKeys).toBe(nullFlattenedKeys)
  })

  it('returns null for every key a serializer declares, without running its callbacks', () => {
    const ContactSerializer = (contact: Contact) =>
      ObjectSerializer(contact)
        .attribute('emailAddress', { as: 'email', openapi: 'string' })
        .customAttribute('emailLength', () => contact.emailAddress.length, { openapi: 'integer' })
        .delegatedAttribute('address', 'city', { openapi: 'string' })
        .rendersOne('address', { serializer: AddressSerializer })
        .rendersMany('addresses', { serializer: AddressSerializer })

    expect(nullFlattenedKeys([ContactSerializer])).toEqual({
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

    expect(nullFlattenedKeys([ContactSerializer])).toEqual({ emailAddress: null, city: null })
  })

  context('a flattened customAttribute', () => {
    it('adds every key of its openapi properties', () => {
      const ContactSerializer = (contact: Contact) =>
        ObjectSerializer(contact).customAttribute('phone', () => ({ phoneNumber: '555-1234' }), {
          flatten: true,
          openapi: { type: 'object', properties: { phoneNumber: 'string', extension: 'string' } },
        })

      expect(nullFlattenedKeys([ContactSerializer])).toEqual({ phoneNumber: null, extension: null })
    })

    it('adds the keys of the serializer a $serializer ref names', () => {
      const ContactSerializer = (contact: Contact) =>
        ObjectSerializer(contact).customAttribute('address', () => AddressSerializer(contact.address), {
          flatten: true,
          openapi: { $serializer: AddressSerializer },
        })

      expect(nullFlattenedKeys([ContactSerializer])).toEqual({ city: null })
    })

    it('adds the keys of every STI child serializer a $serializable ref resolves to', () => {
      const ContactSerializer = (contact: Contact) =>
        ObjectSerializer(contact).customAttribute('balloon', () => null, {
          flatten: true,
          openapi: { $serializable: Balloon, key: 'stiUnion' },
        })

      expect(nullFlattenedKeys([ContactSerializer])).toEqual({
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

      expect(nullFlattenedKeys([ContactSerializer])).toEqual({
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

      expect(nullFlattenedKeys([ContactSerializer])).toEqual({})
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

    expect(nullFlattenedKeys([ContactSerializer], { casing: 'snake' })).toEqual({
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

    expect(nullFlattenedKeys([ContactSerializer], { passthroughData: { locale: 'en' } })).toEqual({
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

    expect(nullFlattenedKeys([NodeSerializer])).toEqual({ label: null })
  })
})
