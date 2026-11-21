import Decorators from '../../../src/decorators/Decorators.js'
import DreamApp from '../../../src/dream-app/index.js'
import {
  declaredShapeSchema,
  modelDeclaredShape,
  openapiColumnShape,
  validateDeclaredShape,
} from '../../../src/openapi/declaredShape.js'
import {
  openapiSchemaAcceptsNull,
  openapiSchemaWithNull,
} from '../../../src/openapi/openapiSchemaNullability.js'
import { DreamColumn } from '../../../src/types/dream.js'
import { OpenapiSchemaBody } from '../../../src/types/openapi.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../test-app/app/models/Composition.js'
import User from '../../../test-app/app/models/User.js'
import processDynamicallyDefinedModels from '../../helpers/processDynamicallyDefinedModels.js'

function jsonShapesModel() {
  const deco = new Decorators<typeof JsonShapesModel>()

  class JsonShapesModel extends ApplicationModel {
    public override get table() {
      return 'model_for_openapi_type_specs' as const
    }

    // nullable jsonb
    @deco.JSON({ type: 'object', required: ['hello'], properties: { hello: 'integer' } })
    public jsonbData: DreamColumn<JsonShapesModel, 'jsonbData'>

    // NOT NULL jsonb
    @deco.JSON({ type: 'object', properties: { hello: 'integer' } })
    public requiredJsonbData: DreamColumn<JsonShapesModel, 'requiredJsonbData'>

    // nullable jsonb[]
    @deco.JSON({ type: 'object', properties: { at: 'date' } })
    public favoriteJsonbs: DreamColumn<JsonShapesModel, 'favoriteJsonbs'>

    // NOT NULL jsonb[]
    @deco.JSON('integer')
    public requiredFavoriteJsonbs: DreamColumn<JsonShapesModel, 'requiredFavoriteJsonbs'>
  }

  processDynamicallyDefinedModels(JsonShapesModel)
  return JsonShapesModel
}

function encryptedShapesModel() {
  const deco = new Decorators<typeof EncryptedShapesModel>()

  class EncryptedShapesModel extends ApplicationModel {
    public override get table() {
      return 'users' as const
    }

    // the encrypted_secret column allows null
    @deco.Encrypted({ openapi: 'integer' })
    public secret: number | null

    // the my_other_encrypted_secret column allows null
    @deco.Encrypted({
      column: 'myOtherEncryptedSecret',
      openapi: { anyOf: [{ type: 'object', properties: { token: 'string' } }, { type: 'null' }] },
    })
    public otherSecret: { token: string } | null
  }

  processDynamicallyDefinedModels(EncryptedShapesModel)
  return EncryptedShapesModel
}

function oneOfNullEncryptedShapeModel() {
  const deco = new Decorators<typeof OneOfNullEncryptedShapeModel>()

  class OneOfNullEncryptedShapeModel extends ApplicationModel {
    public override get table() {
      return 'users' as const
    }

    // the encrypted_secret column allows null
    @deco.Encrypted({
      openapi: { oneOf: [{ type: 'object', properties: { token: 'string' } }, { type: 'null' }] },
    })
    public secret: { token: string } | null
  }

  processDynamicallyDefinedModels(OneOfNullEncryptedShapeModel)
  return OneOfNullEncryptedShapeModel
}

describe('declared shapes', () => {
  it('are reachable through DreamApp.system', () => {
    expect(DreamApp.system.openapiColumnShape).toBe(openapiColumnShape)
    expect(DreamApp.system.declaredShapeSchema).toBe(declaredShapeSchema)
    expect(DreamApp.system.validateDeclaredShape).toBe(validateDeclaredShape)
    expect(DreamApp.system.openapiSchemaWithNull).toBe(openapiSchemaWithNull)
    expect(DreamApp.system.openapiSchemaAcceptsNull).toBe(openapiSchemaAcceptsNull)
  })

  describe('openapiColumnShape', () => {
    const shape: OpenapiSchemaBody = { type: 'object', properties: { hello: { type: 'string' } } }

    it('returns the shape for a column that is not an array and does not allow null', () => {
      expect(openapiColumnShape(shape, { isArray: false, allowNull: false })).toBe(shape)
    })

    it('adds null to the shape for a column that allows null', () => {
      expect(openapiColumnShape(shape, { isArray: false, allowNull: true })).toEqual({
        type: ['object', 'null'],
        properties: { hello: { type: 'string' } },
      })
      expect(
        openapiColumnShape({ anyOf: [{ type: 'integer' }] }, { isArray: false, allowNull: true })
      ).toEqual({
        anyOf: [{ anyOf: [{ type: 'integer' }] }, { type: 'null' }],
      })
    })

    it('leaves a shape that already accepts null as it is', () => {
      const nullable: OpenapiSchemaBody = { anyOf: [{ type: 'integer' }, { type: 'null' }] }
      expect(openapiColumnShape(nullable, { isArray: false, allowNull: true })).toBe(nullable)

      const nullableOneOf: OpenapiSchemaBody = { oneOf: [{ type: 'integer' }, { type: 'null' }] }
      expect(openapiColumnShape(nullableOneOf, { isArray: false, allowNull: true })).toBe(nullableOneOf)
    })

    it('makes an array of the shape for an array column, null when the column allows it', () => {
      expect(openapiColumnShape(shape, { isArray: true, allowNull: false })).toEqual({
        type: 'array',
        items: shape,
      })
      expect(openapiColumnShape(shape, { isArray: true, allowNull: true })).toEqual({
        type: ['array', 'null'],
        items: shape,
      })
    })
  })

  describe('declaredShapeSchema', () => {
    it('is undefined for a property that declares no shape', () => {
      expect(declaredShapeSchema(User, 'email')).toBeUndefined()
      expect(modelDeclaredShape(User, 'email')).toBeUndefined()
    })

    it('is built once per model and property', () => {
      expect(declaredShapeSchema(Composition, 'metadata')).toBe(declaredShapeSchema(Composition, 'metadata'))
    })

    context('@deco.JSON', () => {
      it('expands the shape of a NOT NULL column', () => {
        expect(modelDeclaredShape(Composition, 'metadata')?.decorator).toEqual('@deco.JSON')
        expect(declaredShapeSchema(Composition, 'metadata')).toEqual({
          type: 'object',
          properties: {
            version: { type: 'integer' },
            contributors: { type: 'array', items: { type: 'string' } },
          },
        })
      })

      it('wraps the expanded shape in the column’s array-ness and nullability', () => {
        const JsonShapesModel = jsonShapesModel()

        expect(declaredShapeSchema(JsonShapesModel, 'jsonbData')).toEqual({
          type: ['object', 'null'],
          required: ['hello'],
          properties: { hello: { type: 'integer' } },
        })
        expect(declaredShapeSchema(JsonShapesModel, 'requiredJsonbData')).toEqual({
          type: 'object',
          properties: { hello: { type: 'integer' } },
        })
        expect(declaredShapeSchema(JsonShapesModel, 'favoriteJsonbs')).toEqual({
          type: ['array', 'null'],
          items: { type: 'object', properties: { at: { type: 'string', format: 'date' } } },
        })
        expect(declaredShapeSchema(JsonShapesModel, 'requiredFavoriteJsonbs')).toEqual({
          type: 'array',
          items: { type: 'integer' },
        })
      })
    })

    context('@deco.Virtual', () => {
      it('expands the declared shape, with no column to wrap it', () => {
        expect(modelDeclaredShape(User, 'lbs')).toEqual({
          decorator: '@deco.Virtual',
          shape: 'number',
          column: null,
        })
        expect(declaredShapeSchema(User, 'lbs')).toEqual({ type: 'number' })
        expect(declaredShapeSchema(User, 'kilograms')).toEqual({ type: ['number', 'null'] })
      })
    })

    context('@deco.Encrypted', () => {
      it('checks a bare @deco.Encrypted() as a string, null when the backing column allows it', () => {
        expect(modelDeclaredShape(User, 'secret')?.decorator).toEqual('@deco.Encrypted')
        expect(declaredShapeSchema(User, 'secret')).toEqual({ type: ['string', 'null'] })
      })

      it('adds null from a nullable backing column to a declared shape without it', () => {
        expect(declaredShapeSchema(encryptedShapesModel(), 'secret')).toEqual({ type: ['integer', 'null'] })
      })

      it('leaves a declared shape that already accepts null as declared', () => {
        expect(declaredShapeSchema(encryptedShapesModel(), 'otherSecret')).toEqual({
          anyOf: [{ type: 'object', properties: { token: { type: 'string' } } }, { type: 'null' }],
        })
        expect(declaredShapeSchema(oneOfNullEncryptedShapeModel(), 'secret')).toEqual({
          oneOf: [{ type: 'object', properties: { token: { type: 'string' } } }, { type: 'null' }],
        })
        expect(declaredShapeSchema(User, 'otherSecret')).toEqual({
          type: ['object', 'null'],
          properties: { token: { type: 'string' }, issuedOn: { type: 'string', format: 'date' } },
          required: ['token'],
        })
      })
    })
  })

  describe('validateDeclaredShape', () => {
    it('passes a value that matches the declared shape', () => {
      expect(validateDeclaredShape(Composition, 'metadata', { version: 1, contributors: ['Ann'] })).toEqual({
        isValid: true,
      })
    })

    it('fails a value that does not match, naming where', () => {
      expect(validateDeclaredShape(Composition, 'metadata', { version: 'one' })).toEqual({
        isValid: false,
        errors: [{ instancePath: '/version', keyword: 'type', message: 'must be integer' }],
      })
    })

    it('checks the value as given, without coercion', () => {
      expect(validateDeclaredShape(User, 'lbs', '5').isValid).toBe(false)
      expect(validateDeclaredShape(User, 'lbs', 5).isValid).toBe(true)
    })

    it('checks null against the column’s nullability', () => {
      const JsonShapesModel = jsonShapesModel()
      expect(validateDeclaredShape(JsonShapesModel, 'jsonbData', null).isValid).toBe(true)
      expect(validateDeclaredShape(JsonShapesModel, 'requiredJsonbData', null).isValid).toBe(false)
      expect(validateDeclaredShape(JsonShapesModel, 'favoriteJsonbs', [{ at: '2026-01-01' }]).isValid).toBe(
        true
      )
      expect(validateDeclaredShape(JsonShapesModel, 'favoriteJsonbs', [{ at: 'yesterday' }]).isValid).toBe(
        false
      )
    })

    it('neither coerces nor fills in the value it checks', () => {
      const value = { version: 1, contributors: ['Ann'], extra: true }
      validateDeclaredShape(Composition, 'metadata', value)
      expect(value).toEqual({ version: 1, contributors: ['Ann'], extra: true })
    })

    it('returns errors that a later check does not overwrite', () => {
      const first = validateDeclaredShape(Composition, 'metadata', { version: 'one' })
      const second = validateDeclaredShape(Composition, 'metadata', { contributors: 'Ann' })
      validateDeclaredShape(Composition, 'metadata', { version: 1 })

      expect(first).toEqual({
        isValid: false,
        errors: [{ instancePath: '/version', keyword: 'type', message: 'must be integer' }],
      })
      expect(second).toEqual({
        isValid: false,
        errors: [{ instancePath: '/contributors', keyword: 'type', message: 'must be array' }],
      })
    })

    it('throws for a property that declares no shape', () => {
      expect(() => validateDeclaredShape(User, 'email', 'a@b')).toThrow(/User#email declares no shape/)
    })
  })
})
