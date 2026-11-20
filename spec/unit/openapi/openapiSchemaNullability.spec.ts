import { openapiSchemaAcceptsNull } from '../../../src/openapi/openapiSchemaNullability.js'
import { OpenapiSchemaBody } from '../../../src/types/openapi.js'

describe('openapiSchemaAcceptsNull', () => {
  it('accepts a type that includes null, and rejects one that does not', () => {
    expect(openapiSchemaAcceptsNull({ type: ['string', 'null'] })).toBe(true)
    expect(openapiSchemaAcceptsNull({ type: 'null' })).toBe(true)
    expect(openapiSchemaAcceptsNull({ type: 'string' })).toBe(false)
  })

  it('rejects an enum or const that excludes null', () => {
    expect(openapiSchemaAcceptsNull({ type: ['string', 'null'], enum: ['a'] })).toBe(false)
    expect(openapiSchemaAcceptsNull({ type: ['string', 'null'], enum: ['a', null] })).toBe(true)
  })

  context('anyOf', () => {
    it('accepts null when a branch accepts it', () => {
      expect(openapiSchemaAcceptsNull({ anyOf: [{ type: 'integer' }, { type: 'null' }] })).toBe(true)
      expect(openapiSchemaAcceptsNull({ anyOf: [{ type: 'integer' }, { type: 'string' }] })).toBe(false)
    })
  })

  context('oneOf', () => {
    it('accepts null when exactly one branch accepts it and every other branch rejects it', () => {
      expect(
        openapiSchemaAcceptsNull({
          oneOf: [{ type: 'object', properties: { a: { type: 'string' } } }, { type: 'null' }],
        })
      ).toBe(true)
      expect(
        openapiSchemaAcceptsNull({
          oneOf: [{ type: 'string' }, { type: 'integer' }, { type: 'null' }],
        })
      ).toBe(true)
    })

    it('does not accept null when no branch accepts it', () => {
      expect(openapiSchemaAcceptsNull({ oneOf: [{ type: 'integer' }, { type: 'string' }] })).toBe(false)
    })

    it('does not accept null when two branches accept it, since null then matches more than one', () => {
      expect(openapiSchemaAcceptsNull({ oneOf: [{ type: ['integer', 'null'] }, { type: 'null' }] })).toBe(
        false
      )
    })

    it('does not accept null when another branch cannot be shown to reject it', () => {
      expect(
        openapiSchemaAcceptsNull({
          oneOf: [{ description: 'anything' }, { type: 'null' }],
        } as OpenapiSchemaBody)
      ).toBe(false)
    })
  })

  context('allOf', () => {
    it('accepts null only when every branch accepts it', () => {
      expect(
        openapiSchemaAcceptsNull({
          allOf: [{ type: ['integer', 'null'] }, { anyOf: [{ type: 'integer' }, { type: 'null' }] }],
        })
      ).toBe(true)
      expect(openapiSchemaAcceptsNull({ allOf: [{ type: ['integer', 'null'] }, { type: 'integer' }] })).toBe(
        false
      )
    })
  })

  it('accepts null beside a type that admits it only when each combinator beside it does too', () => {
    expect(
      openapiSchemaAcceptsNull({
        type: ['object', 'null'],
        oneOf: [{ type: 'object' }, { type: 'null' }],
      } as OpenapiSchemaBody)
    ).toBe(true)
    expect(
      openapiSchemaAcceptsNull({
        type: ['object', 'null'],
        oneOf: [{ type: 'object' }, { type: 'object' }],
      } as OpenapiSchemaBody)
    ).toBe(false)
  })

  it('does not accept null through a subschema it cannot read', () => {
    expect(openapiSchemaAcceptsNull({ $ref: '#/components/schemas/Thing' })).toBe(false)
    expect(
      openapiSchemaAcceptsNull({ type: ['string', 'null'], not: { type: 'null' } } as OpenapiSchemaBody)
    ).toBe(false)
    expect(openapiSchemaAcceptsNull({} as OpenapiSchemaBody)).toBe(false)
  })
})
