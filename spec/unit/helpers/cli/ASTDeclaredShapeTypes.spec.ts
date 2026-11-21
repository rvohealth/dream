import STI from '../../../../src/decorators/class/STI.js'
import Decorators from '../../../../src/decorators/Decorators.js'
import {
  DeclaredShapeTypes,
  encryptedAttributeTypes,
  jsonColumnTypes,
  openapiSchemaTypeNode,
  printTypeNode,
} from '../../../../src/helpers/cli/ASTDeclaredShapeTypes.js'
import expandOpenapiShorthand from '../../../../src/openapi/expandOpenapiShorthand.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import User from '../../../../test-app/app/models/User.js'
import processDynamicallyDefinedModels from '../../../helpers/processDynamicallyDefinedModels.js'

function printed(schema: unknown, mode: 'read' | 'write' = 'read') {
  return printTypeNode(openapiSchemaTypeNode(schema, mode)).replace(/\s+/g, ' ')
}

function printedTypes(types: DeclaredShapeTypes | undefined) {
  if (!types) return undefined
  return {
    read: printTypeNode(types.read).replace(/\s+/g, ' '),
    write: printTypeNode(types.write).replace(/\s+/g, ' '),
    same: types.same,
  }
}

describe('ASTDeclaredShapeTypes', () => {
  describe('openapiSchemaTypeNode', () => {
    it('types each primitive type', () => {
      expect(printed({ type: 'string' })).toEqual('string')
      expect(printed({ type: 'integer' })).toEqual('number')
      expect(printed({ type: 'number', format: 'decimal' })).toEqual('number')
      expect(printed({ type: 'boolean' })).toEqual('boolean')
      expect(printed({ type: 'null' })).toEqual('null')
    })

    it('types a list of types as their union', () => {
      expect(printed({ type: ['string', 'null'] })).toEqual('string | null')
    })

    it('types an enum or a const as its literal values', () => {
      expect(printed({ type: ['string', 'null'], enum: ['a', "o'clock", null] })).toEqual(
        `'a' | 'o\\'clock' | null`
      )
      expect(printed({ type: 'integer', enum: [1, -2] })).toEqual('1 | -2')
      expect(printed({ const: true })).toEqual('true')
    })

    it('types an array by its items, and an array without items as unknown[]', () => {
      expect(printed({ type: 'array', items: { type: ['integer', 'null'] } })).toEqual('(number | null)[]')
      expect(printed({ type: 'array' })).toEqual('unknown[]')
    })

    it('types an object as open, with its properties optional unless required', () => {
      expect(
        printed({
          type: 'object',
          properties: { name: { type: 'string' }, 'two words': { type: 'integer' } },
          required: ['name', 'id'],
        })
      ).toEqual(`{ name: string; "two words"?: number; id: unknown; [key: string]: unknown; }`)
    })

    it('types an object with additionalProperties: false as closed', () => {
      expect(
        printed({ type: 'object', properties: { name: { type: 'string' } }, additionalProperties: false })
      ).toEqual('{ name?: string; }')
    })

    it('types the other keys of an object by an additionalProperties schema, admitting its properties too', () => {
      expect(
        printed({
          type: 'object',
          properties: { name: { type: 'string' } },
          additionalProperties: { type: 'integer' },
        })
      ).toEqual('{ name?: string; [key: string]: number | string | undefined; }')
    })

    it('types anyOf and oneOf as unions and allOf as an intersection', () => {
      expect(printed({ anyOf: [{ type: 'string' }, { type: 'null' }] })).toEqual('string | null')
      expect(printed({ oneOf: [{ type: 'integer' }, { type: 'boolean' }] })).toEqual('number | boolean')
      expect(
        printed({
          allOf: [
            { type: 'object', properties: { a: { type: 'string' } }, additionalProperties: false },
            { type: 'object', properties: { b: { type: 'string' } }, additionalProperties: false },
          ],
        })
      ).toEqual('{ a?: string; } & { b?: string; }')
    })

    it('types what the schema does not constrain as unknown', () => {
      expect(printed({})).toEqual('unknown')
      expect(printed({ description: 'anything' })).toEqual('unknown')
      expect(printed({ anyOf: [{ type: 'string' }, {}] })).toEqual('unknown')
    })

    context('a date or date-time string', () => {
      it('reads as a string', () => {
        expect(printed({ type: 'string', format: 'date' })).toEqual('string')
        expect(printed({ type: 'string', format: 'date-time' })).toEqual('string')
      })

      it('also takes a CalendarDate (date) or a DateTime (date-time) when written', () => {
        expect(printed({ type: 'string', format: 'date' }, 'write')).toEqual('string | CalendarDate')
        expect(printed({ type: ['string', 'null'], format: 'date-time' }, 'write')).toEqual(
          'string | DateTime | null'
        )
      })

      it('is typed the same declared in object form as in shorthand', () => {
        for (const mode of ['read', 'write'] as const) {
          expect(printed(expandOpenapiShorthand({ type: 'date' }), mode)).toEqual(
            printed(expandOpenapiShorthand('date'), mode)
          )
          expect(printed(expandOpenapiShorthand({ type: ['date-time', 'null'] }), mode)).toEqual(
            printed(expandOpenapiShorthand(['date-time', 'null']), mode)
          )
        }
      })
    })
  })

  describe('jsonColumnTypes', () => {
    it('types a @deco.JSON column by its shape, read and written alike when it has no date', () => {
      expect(
        printedTypes(jsonColumnTypes([Composition], 'metadata', { isArray: false, allowNull: false }))
      ).toEqual({
        read: '{ version?: number; contributors?: string[]; [key: string]: unknown; }',
        write: '{ version?: number; contributors?: string[]; [key: string]: unknown; }',
        same: true,
      })
    })

    it('wraps the shape for the column it is given, so a column just made nullable or an array is typed so', () => {
      expect(
        printedTypes(jsonColumnTypes([Composition], 'metadata', { isArray: false, allowNull: true }))?.read
      ).toEqual('{ version?: number; contributors?: string[]; [key: string]: unknown; } | null')
      expect(
        printedTypes(jsonColumnTypes([Composition], 'metadata', { isArray: true, allowNull: true }))?.read
      ).toEqual('{ version?: number; contributors?: string[]; [key: string]: unknown; }[] | null')
    })

    it('types a date read as a string and written as a string or a CalendarDate', () => {
      expect(
        printedTypes(jsonColumnTypes([Composition], 'metadata3', { isArray: false, allowNull: true }))
      ).toEqual({
        read: `{ status: 'draft' | 'published'; publishedOn?: string; reviewedOn?: string; reviewedAt?: string; }[] | null`,
        write: `{ status: 'draft' | 'published'; publishedOn?: string | CalendarDate; reviewedOn?: string | CalendarDate; reviewedAt?: string | DateTime; }[] | null`,
        same: false,
      })
    })

    it('is undefined for a column no model declares with @deco.JSON', () => {
      expect(jsonColumnTypes([Composition], 'metadata2', { isArray: false, allowNull: true })).toBeUndefined()
    })
  })

  describe('encryptedAttributeTypes', () => {
    it('types each @deco.Encrypted property by its declared shape, and a bare one as a string', () => {
      const types = encryptedAttributeTypes([User], () => true)

      expect([...types.keys()]).toEqual(['otherSecret', 'secret'])
      expect(printedTypes(types.get('secret'))).toEqual({
        read: 'string | null',
        write: 'string | null',
        same: true,
      })
      expect(printedTypes(types.get('otherSecret'))).toEqual({
        read: '{ token: string; issuedOn?: string; [key: string]: unknown; } | null',
        write: '{ token: string; issuedOn?: string | CalendarDate; [key: string]: unknown; } | null',
        same: false,
      })
    })

    it('takes the nullability of a bare one from the backing column as given, not as the app booted with it', () => {
      // User registered `secret` as ['string', 'null'] from the nullable
      // encrypted_secret column in the schema it booted with
      const types = encryptedAttributeTypes([User], column => column !== 'encryptedSecret')

      expect(printedTypes(types.get('secret'))?.read).toEqual('string')
    })

    it('types a property that STI children declare with different shapes as the union of them', () => {
      const deco = new Decorators<typeof SecretiveBase>()

      class SecretiveBase extends ApplicationModel {
        public override get table() {
          return 'sti_bases' as const
        }

        public id: DreamColumn<SecretiveBase, 'id'>
      }

      const stringDeco = new Decorators<typeof StringSecretChild>()
      @STI(SecretiveBase)
      class StringSecretChild extends SecretiveBase {
        @stringDeco.Encrypted()
        public secret: string
      }

      const dateDeco = new Decorators<typeof DateSecretChild>()
      @STI(SecretiveBase)
      class DateSecretChild extends SecretiveBase {
        @dateDeco.Encrypted({ openapi: 'date' })
        public secret: string
      }
      void deco

      processDynamicallyDefinedModels(SecretiveBase, StringSecretChild, DateSecretChild)

      const types = encryptedAttributeTypes([SecretiveBase, StringSecretChild, DateSecretChild], () => true)
      expect(printedTypes(types.get('secret'))).toEqual({
        read: 'string | null',
        write: 'string | null | CalendarDate',
        same: false,
      })
    })

    it('is empty for a table whose models declare no @deco.Encrypted property', () => {
      expect(encryptedAttributeTypes([Pet], () => true).size).toEqual(0)
    })
  })
})
