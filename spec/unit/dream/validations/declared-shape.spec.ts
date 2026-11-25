import STI from '../../../../src/decorators/class/STI.js'
import Decorators from '../../../../src/decorators/Decorators.js'
import DreamApp, { EncryptionLegacyKeyUsedEvent } from '../../../../src/dream-app/index.js'
import Encrypt from '../../../../src/encrypt/index.js'
import ValidationError from '../../../../src/errors/ValidationError.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import CalendarDate from '../../../../src/utils/datetime/CalendarDate.js'
import { DateTime } from '../../../../src/utils/datetime/DateTime.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import StiA from '../../../../test-app/app/models/Sti/A.js'
import User from '../../../../test-app/app/models/User.js'
import db from '../../../../test-app/db/index.js'
import processDynamicallyDefinedModels from '../../../helpers/processDynamicallyDefinedModels.js'

// A shape declared with @deco.JSON or @deco.Encrypted is a model invariant:
// every save through a model instance (and `isValid`) checks the value the
// record would store against it, whoever writes it.

async function saveError(save: () => Promise<unknown>): Promise<ValidationError> {
  let thrownError: unknown
  try {
    await save()
  } catch (err) {
    thrownError = err
  }

  expect(thrownError).toBeInstanceOf(ValidationError)
  return thrownError as ValidationError
}

function jsonShapeModel() {
  const deco = new Decorators<typeof JsonShapeModel>()

  class JsonShapeModel extends ApplicationModel {
    public override get table() {
      return 'model_for_openapi_type_specs' as const
    }

    public id: DreamColumn<JsonShapeModel, 'id'>
    public email: DreamColumn<JsonShapeModel, 'email'>
    public name: DreamColumn<JsonShapeModel, 'name'>
    public passwordDigest: DreamColumn<JsonShapeModel, 'passwordDigest'>

    // nullable jsonb
    @deco.JSON({ type: 'object', properties: { hello: 'integer' } })
    public jsonbData: DreamColumn<JsonShapeModel, 'jsonbData'>

    // NOT NULL json, default '{}'
    @deco.JSON({ type: 'object', properties: { hello: 'integer' }, required: ['hello'] })
    public requiredJsonData: DreamColumn<JsonShapeModel, 'requiredJsonData'>

    // nullable jsonb[], whose shape describes each element
    @deco.JSON({ type: 'object', properties: { label: 'string' }, required: ['label'] })
    public favoriteJsonbs: DreamColumn<JsonShapeModel, 'favoriteJsonbs'>
  }

  JsonShapeModel['defineAttributeAccessors']()
  processDynamicallyDefinedModels(JsonShapeModel)
  return JsonShapeModel
}

const requiredAttributes = {
  email: 'a@b.com',
  passwordDigest: 'abcd',
  requiredJsonData: { hello: 1 },
}

describe('a @deco.JSON shape checked at save', () => {
  it('is registered as a declaredShape validation of the column', () => {
    expect(Composition['validations']).toEqual(
      expect.arrayContaining([{ type: 'declaredShape', column: 'metadata', options: {} }])
    )
  })

  context('with a value that matches the shape', () => {
    it('creates and updates the record', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user, metadata: { version: 2 } })
      await composition.update({ metadata: { version: 3, contributors: ['Ann'] } })

      expect((await Composition.findOrFail(composition.id)).metadata).toEqual({
        version: 3,
        contributors: ['Ann'],
      })
    })
  })

  context('with a value that does not match the shape', () => {
    it('refuses to create the record, naming the column and the declaredShape validation', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      // @ts-expect-error metadata is typed by its declared shape, so this is a compile error too
      const error = await saveError(() => Composition.create({ user, metadata: { version: 'two' } }))
      expect(error.errors).toEqual({ metadata: ['declaredShape'] })
      expect(await Composition.count()).toEqual(0)
    })

    it('refuses to update the record, leaving the stored value', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user, metadata: { version: 2 } })

      // @ts-expect-error metadata is typed by its declared shape, so this is a compile error too
      const error = await saveError(() => composition.update({ metadata: { contributors: [7] } }))
      expect(error.errors).toEqual({ metadata: ['declaredShape'] })
      expect((await Composition.findOrFail(composition.id)).metadata).toEqual({ version: 2 })
    })

    it('makes isValid false', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      // @ts-expect-error metadata is typed by its declared shape, so this is a compile error too
      const composition = Composition.new({ user, metadata: { version: 'two' } })

      expect(composition.isValid).toBe(false)
      expect(composition.errors).toEqual({ metadata: ['declaredShape'] })
    })
  })

  context('on a NOT NULL column', () => {
    it('refuses null as a validation error', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const error = await saveError(() => Composition.create({ user, metadata: null as any }))
      expect(error.errors).toEqual({ metadata: ['declaredShape'] })
    })
  })

  context('on a nullable column', () => {
    it('accepts null, and checks a value', async () => {
      const JsonShapeModel = jsonShapeModel()

      const model = await JsonShapeModel.create({ ...requiredAttributes, jsonbData: null })
      expect((await JsonShapeModel.findOrFail(model.id)).jsonbData).toBeNull()

      const error = await saveError(() => model.update({ jsonbData: { hello: 'world' } }))
      expect(error.errors).toEqual({ jsonbData: ['declaredShape'] })
    })
  })

  context('on a json[] or jsonb[] column', () => {
    it('checks each element, and accepts null for the nullable column', async () => {
      const JsonShapeModel = jsonShapeModel()

      const model = await JsonShapeModel.create({ ...requiredAttributes, favoriteJsonbs: [{ label: 'a' }] })
      expect((await JsonShapeModel.findOrFail(model.id)).favoriteJsonbs).toEqual([{ label: 'a' }])

      await model.update({ favoriteJsonbs: null })
      expect((await JsonShapeModel.findOrFail(model.id)).favoriteJsonbs).toBeNull()

      const error = await saveError(() => model.update({ favoriteJsonbs: [{ label: 'a' }, { label: 5 }] }))
      expect(error.errors).toEqual({ favoriteJsonbs: ['declaredShape'] })

      // an element may be null only when the shape allows it
      await saveError(() => model.update({ favoriteJsonbs: [{ label: 'a' }, null] as any }))
    })

    context('with a date or date-time element property', () => {
      function jsonArrayDateModel() {
        const deco = new Decorators<typeof JsonArrayDateModel>()

        class JsonArrayDateModel extends ApplicationModel {
          public override get table() {
            return 'model_for_openapi_type_specs' as const
          }

          public id: DreamColumn<JsonArrayDateModel, 'id'>

          @deco.JSON({ type: 'object', properties: { on: 'date', at: 'date-time' }, required: ['on'] })
          public favoriteJsonbs: DreamColumn<JsonArrayDateModel, 'favoriteJsonbs'>
        }

        JsonArrayDateModel['defineAttributeAccessors']()
        processDynamicallyDefinedModels(JsonArrayDateModel)
        return JsonArrayDateModel
      }

      // the generated type reads such a property as a string and writes it
      // as a string, a CalendarDate or a DateTime; the column keeps the value
      // as the JSON the database stores, so it reads back as that string
      // before a save as after one. (This dynamically defined model is typed
      // by the undecorated test-app column, hence the casts.)
      const on = CalendarDate.fromISO('2026-11-20')
      const at = DateTime.fromISO('2026-11-20T10:30:00.000Z', { zone: 'UTC' })

      it('reads a CalendarDate or DateTime given for it back as its JSON string, before a save', () => {
        const JsonArrayDateModel = jsonArrayDateModel()
        const model = JsonArrayDateModel.new({ favoriteJsonbs: [{ on, at }] as any })

        const expected = [{ on: on.toJSON(), at: at.toJSON() }]
        expect(model.favoriteJsonbs).toEqual(expected)
        expect(model.getAttribute('favoriteJsonbs')).toEqual(expected)
        expect(model.isValid).toBe(true)

        model.favoriteJsonbs = [{ on }] as any
        expect(model.favoriteJsonbs).toEqual([{ on: on.toJSON() }])

        model.setAttribute('favoriteJsonbs', [{ on, at }])
        expect(model.getAttribute('favoriteJsonbs')).toEqual(expected)
      })

      it('stores the same JSON it read back before the save', async () => {
        const JsonArrayDateModel = jsonArrayDateModel()
        const model = await JsonArrayDateModel.create({
          ...requiredAttributes,
          favoriteJsonbs: [{ on, at }],
        } as any)

        const expected = [{ on: on.toJSON(), at: at.toJSON() }]
        expect(model.favoriteJsonbs).toEqual(expected)
        expect((await JsonArrayDateModel.findOrFail(model.id)).favoriteJsonbs).toEqual(expected)
      })
    })
  })

  context('with text given for the column', () => {
    it('checks JSON text as the value it encodes', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const composition = await Composition.create({ user, metadata: '{"version":2}' as any })
      expect((await Composition.findOrFail(composition.id)).metadata).toEqual({ version: 2 })

      const error = await saveError(() => composition.update({ metadata: '{"version":"two"}' as any }))
      expect(error.errors).toEqual({ metadata: ['declaredShape'] })
    })

    it('fails the validation for text that is not JSON, rather than throwing a SyntaxError', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = Composition.new({ user, metadata: 'hello' as any })

      expect(composition.isValid).toBe(false)
      expect(composition.errors).toEqual({ metadata: ['declaredShape'] })

      const error = await saveError(() => composition.save())
      expect(error.errors).toEqual({ metadata: ['declaredShape'] })
    })
  })

  // JSON text is Unicode-normalized on its way to the database, so the value
  // stored is the one the normalized text encodes, and that is the one checked
  context('with a value that Unicode normalization changes', () => {
    function normalizedJsonShapeModel() {
      const deco = new Decorators<typeof NormalizedJsonShapeModel>()

      class NormalizedJsonShapeModel extends ApplicationModel {
        public override get table() {
          return 'model_for_openapi_type_specs' as const
        }

        public id: DreamColumn<NormalizedJsonShapeModel, 'id'>

        @deco.JSON({
          type: 'object',
          properties: {
            apiKeyScope: { type: 'string', enum: ['readonly', 'readwrite'] },
            note: { type: 'string', maxLength: 4 },
          },
        })
        public jsonbData: DreamColumn<NormalizedJsonShapeModel, 'jsonbData'>
      }

      NormalizedJsonShapeModel['defineAttributeAccessors']()
      processDynamicallyDefinedModels(NormalizedJsonShapeModel)
      return NormalizedJsonShapeModel
    }

    it('checks a key that normalizes into a declared property as that property', async () => {
      const NormalizedJsonShapeModel = normalizedJsonShapeModel()

      // the Kelvin sign (U+212A) normalizes to `K`, so the text stored has
      // `apiKeyScope` twice, and the database keeps the last, 'admin'
      const error = await saveError(() =>
        NormalizedJsonShapeModel.create({
          ...requiredAttributes,
          jsonbData: { apiKeyScope: 'readonly', apiKeyScope: 'admin' },
        } as any)
      )
      expect(error.errors).toEqual({ jsonbData: ['declaredShape'] })
    })

    it('checks a string at the length it is stored with', async () => {
      const NormalizedJsonShapeModel = normalizedJsonShapeModel()

      // U+FB2C normalizes to three characters, so four of them are stored as twelve
      const error = await saveError(() =>
        NormalizedJsonShapeModel.create({
          ...requiredAttributes,
          jsonbData: { note: 'שּׁ'.repeat(4) },
        } as any)
      )
      expect(error.errors).toEqual({ jsonbData: ['declaredShape'] })

      // an `e` and a combining acute accent normalize to one character, so
      // four pairs are stored as four characters
      const model = await NormalizedJsonShapeModel.create({
        ...requiredAttributes,
        jsonbData: { note: 'é'.repeat(4) },
      } as any)
      expect((await NormalizedJsonShapeModel.findOrFail(model.id)).jsonbData).toEqual({ note: 'é'.repeat(4) })
    })
  })

  context('with the attribute unset', () => {
    it('does not check it, so the column default is stored', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = Composition.new({ user })

      expect(composition.isValid).toBe(true)
      await composition.save()
      expect((await Composition.findOrFail(composition.id)).metadata).toEqual({})
    })
  })

  context('on a loaded record whose stored value does not match the shape', () => {
    it('refuses a save that changes another column', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user, metadata: { version: 2 } })
      await db('default', 'primary')
        .updateTable('compositions')
        .set({ metadata: JSON.stringify({ version: 'two' }) })
        .where('id', '=', composition.id)
        .execute()

      const reloaded = await Composition.findOrFail(composition.id)
      expect(reloaded.isValid).toBe(false)

      const error = await saveError(() => reloaded.update({ content: 'changed' }))
      expect(error.errors).toEqual({ metadata: ['declaredShape'] })
    })
  })

  context('on an STI child of a base that declares the shape', () => {
    function defineJsonStiModels() {
      const deco = new Decorators<typeof JsonStiBase>()

      class JsonStiBase extends ApplicationModel {
        public override get table() {
          return 'model_for_openapi_type_specs' as const
        }

        @deco.JSON({ type: 'object', properties: { hello: 'integer' } })
        public jsonbData: DreamColumn<JsonStiBase, 'jsonbData'>
      }

      @STI(JsonStiBase)
      class JsonStiChild extends JsonStiBase {}

      JsonStiBase['defineAttributeAccessors']()
      JsonStiChild['defineAttributeAccessors']()
      return { JsonStiBase, JsonStiChild }
    }

    it('checks the child once when the child is initialized after its base', () => {
      const { JsonStiBase, JsonStiChild } = defineJsonStiModels()
      processDynamicallyDefinedModels(JsonStiBase, JsonStiChild)

      const child = JsonStiChild.new({ jsonbData: { hello: 'world' } })
      expect(child.isValid).toBe(false)
      expect(child.errors).toEqual({ jsonbData: ['declaredShape'] })
    })

    it('checks the child once when the child is initialized first', () => {
      const { JsonStiBase, JsonStiChild } = defineJsonStiModels()
      processDynamicallyDefinedModels(JsonStiChild, JsonStiBase)

      const child = JsonStiChild.new({ jsonbData: { hello: 'world' } })
      expect(child.isValid).toBe(false)
      expect(child.errors).toEqual({ jsonbData: ['declaredShape'] })
    })
  })
})

function userWithEncryptedShape<const Shape>(openapi: Shape) {
  const deco = new Decorators<typeof UserWithEncryptedShape>()

  class UserWithEncryptedShape extends ApplicationModel {
    public override get table() {
      return 'users' as const
    }

    public id: DreamColumn<UserWithEncryptedShape, 'id'>
    public email: DreamColumn<UserWithEncryptedShape, 'email'>
    public passwordDigest: DreamColumn<UserWithEncryptedShape, 'passwordDigest'>

    // on the nullable `encrypted_secret` column. The generated schema types
    // the users table's `secret` by User's declaration (a string), not by this
    // one, so a spec writing another type casts it
    @deco.Encrypted({ openapi: openapi as any })
    public secret: unknown
  }

  UserWithEncryptedShape['defineAttributeAccessors']()
  processDynamicallyDefinedModels(UserWithEncryptedShape)
  return UserWithEncryptedShape
}

describe('a @deco.Encrypted shape checked at save', () => {
  it('is registered as a declaredShape validation of the property', () => {
    expect(User['validations']).toEqual(
      expect.arrayContaining([
        { type: 'declaredShape', column: 'secret', options: {} },
        { type: 'declaredShape', column: 'otherSecret', options: {} },
      ])
    )
  })

  context('with an object shape', () => {
    it('saves a matching value and refuses one that does not match, naming the property', async () => {
      const user = await User.create({ email: 'a@b.com', password: 's3cr3t!', otherSecret: { token: 'shh' } })
      expect((await User.findOrFail(user.id)).otherSecret).toEqual({ token: 'shh' })

      const error = await saveError(() => user.update({ otherSecret: { nope: 'shh' } as any }))
      expect(error.errors).toEqual({ otherSecret: ['declaredShape'] })
      expect((await User.findOrFail(user.id)).otherSecret).toEqual({ token: 'shh' })
    })
  })

  context('with a plain-value shape', () => {
    it('checks the value as assigned, with no coercion', async () => {
      const UserWithEncryptedShape = userWithEncryptedShape('integer')

      const user = await UserWithEncryptedShape.create({
        email: 'a@b.com',
        passwordDigest: 'abcd',
        secret: 5 as any,
      })
      expect((await UserWithEncryptedShape.findOrFail(user.id)).secret).toEqual(5)

      const error = await saveError(() => user.update({ secret: '5' }))
      expect(error.errors).toEqual({ secret: ['declaredShape'] })
    })

    it('accepts null on a nullable backing column though the shape does not include null', async () => {
      const UserWithEncryptedShape = userWithEncryptedShape('integer')

      const user = await UserWithEncryptedShape.create({
        email: 'a@b.com',
        passwordDigest: 'abcd',
        secret: 5 as any,
      })
      await user.update({ secret: null })
      expect((await UserWithEncryptedShape.findOrFail(user.id)).secret).toBeNull()
    })
  })

  context('declared without a shape', () => {
    it('checks the value against a string, or null on a nullable backing column', async () => {
      const user = await User.create({ email: 'a@b.com', password: 's3cr3t!', secret: 'shh' })
      await user.update({ secret: null })
      expect((await User.findOrFail(user.id)).secret).toBeNull()

      const error = await saveError(() => user.update({ secret: 5 as any }))
      expect(error.errors).toEqual({ secret: ['declaredShape'] })
    })

    it('checks it on an STI child', () => {
      const child = StiA.new({ secret: 5 as any })
      expect(child.isValid).toBe(false)
      expect(child.errors.secret).toEqual(['declaredShape'])
    })
  })

  context('with the attribute unset', () => {
    it('does not check it', async () => {
      const UserWithEncryptedShape = userWithEncryptedShape({
        type: 'object',
        properties: { token: 'string' },
      })
      const user = UserWithEncryptedShape.new({ email: 'a@b.com', passwordDigest: 'abcd' })

      expect(user.isValid).toBe(true)
      await user.save()
    })
  })

  context('on a loaded record whose backing columns are null, in an app with no column encryption', () => {
    it('takes the null without decrypting it, so the record validates and saves', async () => {
      const user = await User.create({ email: 'a@b.com', password: 's3cr3t!' })
      // an app that never sets `encryption`, as DreamApp.init allows
      DreamApp.getOrFail().set('encryption', undefined as any)

      const reloaded = await User.findOrFail(user.id)
      expect(reloaded.getAttribute('encryptedSecret')).toBeNull()
      expect(reloaded.getAttribute('myOtherEncryptedSecret')).toBeNull()
      expect(reloaded.isValid).toBe(true)

      await reloaded.update({ email: 'c@d.com' })
      expect((await User.findOrFail(user.id)).email).toEqual('c@d.com')
    })
  })

  context('on a loaded record whose ciphertext no longer decrypts', () => {
    it('fails the validation, refusing a save that changes another column', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin', secret: 'original' })
      DreamApp.getOrFail().set('encryption', {
        columns: { current: { algorithm: 'aes-256-gcm', key: Encrypt.generateKey('aes-256-gcm') } },
      })

      const reloaded = await User.findOrFail(user.id)
      expect(reloaded.isValid).toBe(false)
      expect(reloaded.errors).toEqual({ secret: ['declaredShape'] })

      const error = await saveError(() => reloaded.update({ email: 'chalupas@dujour' }))
      expect(error.errors).toEqual({ secret: ['declaredShape'] })
    })
  })

  context('on a loaded record whose ciphertext only the legacy key opens', () => {
    it('validates and saves without firing encryption:legacy-key-used', async () => {
      const oldKey = Encrypt.generateKey('aes-256-gcm')
      const newKey = Encrypt.generateKey('aes-256-gcm')
      const dreamApp = DreamApp.getOrFail()
      dreamApp.set('encryption', { columns: { current: { algorithm: 'aes-256-gcm', key: oldKey } } })
      const user = await User.create({ email: 'a@b.com', password: 's3cr3t!', secret: 'shh' })
      dreamApp.set('encryption', {
        columns: {
          current: { algorithm: 'aes-256-gcm', key: newKey },
          legacy: { algorithm: 'aes-256-gcm', key: oldKey },
        },
      })
      const listener = vi.fn<(event: EncryptionLegacyKeyUsedEvent) => void>()
      dreamApp.on('encryption:legacy-key-used', listener)

      const reloaded = await User.findOrFail(user.id)
      expect(reloaded.isValid).toBe(true)
      await reloaded.update({ email: 'c@d.com' })

      expect(listener).not.toHaveBeenCalled()
    })
  })

  context('validating a loaded record', () => {
    it('leaves the backing column as loaded, so the record stays clean', async () => {
      const user = await User.create({ email: 'a@b.com', password: 's3cr3t!', secret: 'shh' })
      const reloaded = await User.findOrFail(user.id)
      const ciphertext = reloaded.getAttribute('encryptedSecret')

      expect(reloaded.isValid).toBe(true)
      expect(reloaded.getAttribute('encryptedSecret')).toEqual(ciphertext)
      expect(reloaded.isDirty).toBe(false)
      expect(reloaded.dirtyAttributes()).toEqual({})
    })
  })

  context('with a value whose keys do not match the shape', () => {
    it('puts no part of the plaintext, keys included, in the error or in anything the save logs', async () => {
      const UserWithEncryptedShape = userWithEncryptedShape({
        type: 'object',
        properties: { token: 'string' },
        additionalProperties: false,
      })
      const logged: unknown[] = []
      const logger = DreamApp.getOrFail().logger
      for (const level of ['debug', 'info', 'warn', 'error'] as const)
        vi.spyOn(logger, level).mockImplementation((...args: unknown[]) => void logged.push(...args))
      for (const level of ['log', 'debug', 'info', 'warn', 'error'] as const)
        vi.spyOn(console, level).mockImplementation((...args: unknown[]) => void logged.push(...args))

      const user = UserWithEncryptedShape.new({ email: 'a@b.com', passwordDigest: 'abcd' })
      user.secret = { 'ssn-078-05-1120': 'plaintext-value' }

      const error = await saveError(() => user.save())
      vi.restoreAllMocks()

      expect(error.errors).toEqual({ secret: ['declaredShape'] })
      const exposed = JSON.stringify([error.message, error.errors, user.errors, logged.map(String)])
      expect(exposed).not.toContain('ssn-078-05-1120')
      expect(exposed).not.toContain('plaintext-value')
    })
  })
})
