import STI from '../../../src/decorators/class/STI.js'
import Decorators from '../../../src/decorators/Decorators.js'
import DreamApp, { DreamAppInitOptions } from '../../../src/dream-app/index.js'
import Dream from '../../../src/Dream.js'
import ModelDeclaredShapeDoesNotCompile from '../../../src/errors/ModelDeclaredShapeDoesNotCompile.js'
import { validateDeclaredShape } from '../../../src/openapi/declaredShape.js'
import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import initializeDreamApp from '../../../test-app/cli/helpers/initializeDreamApp.js'
import processDynamicallyDefinedModels from '../../helpers/processDynamicallyDefinedModels.js'

// A shape a model declares that AJV cannot compile into the validator Dream
// checks the property's value with is refused while DreamApp.init runs, in a
// Dream-only app, never first at a save or a request.

// Loads the models as the app's models load, then boots the app with them
// among the app's models, so DreamApp#init validates them as it validates
// every model
async function bootWith(modelClasses: (typeof Dream)[], opts: DreamAppInitOptions = {}) {
  processDynamicallyDefinedModels(...modelClasses)
  const models = { ...DreamApp.getOrFail().models }
  for (const modelClass of modelClasses) models[modelClass.name] = modelClass
  vi.spyOn(DreamApp.prototype, 'models', 'get').mockReturnValue(models)
  return await initializeDreamApp(opts)
}

async function bootErrorWith(...modelClasses: (typeof Dream)[]): Promise<ModelDeclaredShapeDoesNotCompile> {
  let thrownError: unknown
  try {
    await bootWith(modelClasses)
  } catch (err) {
    thrownError = err
  }

  expect(thrownError).toBeInstanceOf(ModelDeclaredShapeDoesNotCompile)
  return thrownError as ModelDeclaredShapeDoesNotCompile
}

function jsonShapeModel(shape: unknown) {
  const deco = new Decorators<typeof JsonShapeModel>()

  class JsonShapeModel extends ApplicationModel {
    public override get table() {
      return 'model_for_openapi_type_specs' as const
    }

    @deco.JSON(shape as any)
    public jsonbData: DreamColumn<JsonShapeModel, 'jsonbData'>
  }

  return JsonShapeModel
}

const INVALID_UNDER_UNICODE_FLAG = '^\\d{3}\\-\\d{4}$'

describe('DreamApp#init compiles every declared shape', () => {
  it('refuses a @deco.JSON pattern that is invalid under the unicode flag, naming the model, property, decorator and AJV’s error', async () => {
    const error = await bootErrorWith(
      jsonShapeModel({
        type: 'object',
        properties: { phone: { type: 'string', pattern: INVALID_UNDER_UNICODE_FLAG } },
      })
    )

    expect(error.message).toContain('@deco.JSON on JsonShapeModel#jsonbData')
    expect(error.message).toMatch(/Invalid regular expression/)
    expect(error.message).toContain('valid regular\nexpression under the `u` flag')
    expect(error.message).toContain('use `anyOf` rather than a `type` array')
    expect(error.message).toContain('give `properties` a map of property names to shapes')
    expect(error.cause).toBeInstanceOf(Error)
  })

  it('refuses a @deco.JSON union type, which strict types do not allow', async () => {
    const error = await bootErrorWith(
      jsonShapeModel({ type: 'object', properties: { v: { type: ['string', 'number'] } } })
    )

    expect(error.message).toContain('@deco.JSON on JsonShapeModel#jsonbData')
    expect(error.message).toContain('allowUnionTypes')
  })

  it('refuses a composition written in place of the properties map', async () => {
    const error = await bootErrorWith(
      jsonShapeModel({ type: 'object', properties: { oneOf: [{ type: 'object' }, { type: 'array' }] } })
    )

    expect(error.message).toContain('@deco.JSON on JsonShapeModel#jsonbData')
    expect(error.message).toContain('data/properties/oneOf must be object,boolean')
  })

  it('refuses an object @deco.Virtual shape that cannot be compiled', async () => {
    const deco = new Decorators<typeof VirtualShapeModel>()

    class VirtualShapeModel extends ApplicationModel {
      public override get table() {
        return 'model_for_openapi_type_specs' as const
      }

      @deco.Virtual({ type: 'object', properties: { code: { type: 'string', pattern: '\\-' } } })
      public code: { code: string }
    }

    const error = await bootErrorWith(VirtualShapeModel)
    expect(error.message).toContain('@deco.Virtual on VirtualShapeModel#code')
  })

  it('refuses a plain-value @deco.Virtual shape that cannot be compiled', async () => {
    const deco = new Decorators<typeof PrimitiveVirtualShapeModel>()

    class PrimitiveVirtualShapeModel extends ApplicationModel {
      public override get table() {
        return 'model_for_openapi_type_specs' as const
      }

      @deco.Virtual({ type: 'string', pattern: INVALID_UNDER_UNICODE_FLAG })
      public phone: string
    }

    const error = await bootErrorWith(PrimitiveVirtualShapeModel)
    expect(error.message).toContain('@deco.Virtual on PrimitiveVirtualShapeModel#phone')
    expect(error.message).toMatch(/Invalid regular expression/)
  })

  it('names @deco.Encrypted for an encrypted attribute, plain-value shapes included', async () => {
    const deco = new Decorators<typeof EncryptedShapeModel>()

    class EncryptedShapeModel extends ApplicationModel {
      public override get table() {
        return 'users' as const
      }

      @deco.Encrypted({ openapi: { type: 'string', pattern: INVALID_UNDER_UNICODE_FLAG } })
      public secret: string
    }

    const error = await bootErrorWith(EncryptedShapeModel)
    expect(error.message).toContain('@deco.Encrypted on EncryptedShapeModel#secret')
  })

  context('a shape declaring AJV’s `$async: true`', () => {
    // AJV compiles a root `$async: true` into a validator that returns a
    // Promise, which a synchronous check would read as a pass; a non-literal
    // constant gets past TypeScript's excess-property check
    const ASYNC_SHAPE = { type: 'string' as const, pattern: '^allowed$', $async: true }

    it('refuses a @deco.Encrypted shape, since Dream checks a declared shape synchronously', async () => {
      const deco = new Decorators<typeof AsyncEncryptedShapeModel>()

      class AsyncEncryptedShapeModel extends ApplicationModel {
        public override get table() {
          return 'users' as const
        }

        @deco.Encrypted({ openapi: ASYNC_SHAPE })
        public secret: string
      }

      const error = await bootErrorWith(AsyncEncryptedShapeModel)
      expect(error.message).toContain('@deco.Encrypted on AsyncEncryptedShapeModel#secret')
      expect(error.message).toContain('`$async: true`')
      expect(error.message).toContain('remove\n`$async`, since Dream checks a declared shape synchronously')
    })

    it('refuses a plain-value @deco.Virtual shape', async () => {
      const deco = new Decorators<typeof AsyncVirtualShapeModel>()

      class AsyncVirtualShapeModel extends ApplicationModel {
        public override get table() {
          return 'model_for_openapi_type_specs' as const
        }

        @deco.Virtual(ASYNC_SHAPE)
        public code: string
      }

      const error = await bootErrorWith(AsyncVirtualShapeModel)
      expect(error.message).toContain('@deco.Virtual on AsyncVirtualShapeModel#code')
      expect(error.message).toContain('`$async: true`')
    })

    it('refuses `$async: true` nested inside a @deco.JSON shape', async () => {
      const error = await bootErrorWith(
        jsonShapeModel({ type: 'object', properties: { code: { type: 'string', $async: true } } })
      )

      expect(error.message).toContain('@deco.JSON on JsonShapeModel#jsonbData')
      expect(error.message).toContain('async schema in sync schema')
    })

    it('under bypassDreamIntegrityChecks, throws the same error when the shape is first checked, never reading the Promise as a pass', async () => {
      const deco = new Decorators<typeof LazyAsyncShapeModel>()

      class LazyAsyncShapeModel extends ApplicationModel {
        public override get table() {
          return 'model_for_openapi_type_specs' as const
        }

        @deco.Virtual(ASYNC_SHAPE)
        public code: string
      }

      await expect(
        bootWith([LazyAsyncShapeModel], { bypassDreamIntegrityChecks: true })
      ).resolves.toBeInstanceOf(DreamApp)

      for (let check = 0; check < 2; check++) {
        expect(() => validateDeclaredShape(LazyAsyncShapeModel, 'code', 'different')).toThrow(
          /@deco\.Virtual on LazyAsyncShapeModel#code[\s\S]*`\$async: true`/
        )
      }
    })
  })

  it('refuses a shape an STI child declares itself, naming the child', async () => {
    class ShapeStiBase extends ApplicationModel {
      public override get table() {
        return 'sti_bases' as const
      }

      public id: DreamColumn<ShapeStiBase, 'id'>
    }

    const deco = new Decorators<typeof ShapeStiChild>()

    @STI(ShapeStiBase)
    class ShapeStiChild extends ShapeStiBase {
      @deco.Encrypted({
        openapi: { type: 'object', properties: { v: { type: ['string', 'number'] } } } as any,
      })
      public secret: { v: string | number }
    }

    const error = await bootErrorWith(ShapeStiBase, ShapeStiChild)
    expect(error.message).toContain('@deco.Encrypted on ShapeStiChild#secret')
  })

  it('boots with declared shapes that compile, which are then checked', async () => {
    const ValidShapeModel = jsonShapeModel({
      type: 'object',
      properties: { phone: { type: 'string', pattern: '^\\d{3}-\\d{4}$' } },
    })

    await expect(bootWith([ValidShapeModel])).resolves.toBeInstanceOf(DreamApp)
    expect(validateDeclaredShape(ValidShapeModel, 'jsonbData', { phone: '555-1234' }).isValid).toBe(true)
    expect(validateDeclaredShape(ValidShapeModel, 'jsonbData', { phone: 'nope' }).isValid).toBe(false)
  })

  it('boots a @deco.JSON shape whose properties are named oneOf, anyOf and allOf, checking each as a property', async () => {
    const CombinatorNamedPropertiesModel = jsonShapeModel({
      type: 'object',
      properties: { oneOf: 'string', anyOf: ['integer', 'null'], allOf: { type: 'boolean' } },
      required: ['oneOf'],
    })

    await expect(bootWith([CombinatorNamedPropertiesModel])).resolves.toBeInstanceOf(DreamApp)
    expect(
      validateDeclaredShape(CombinatorNamedPropertiesModel, 'jsonbData', {
        oneOf: 'a',
        anyOf: null,
        allOf: true,
      }).isValid
    ).toBe(true)
    expect(validateDeclaredShape(CombinatorNamedPropertiesModel, 'jsonbData', { anyOf: 1 }).isValid).toBe(
      false
    )
    expect(
      validateDeclaredShape(CombinatorNamedPropertiesModel, 'jsonbData', { oneOf: 'a', anyOf: 'b' }).isValid
    ).toBe(false)
  })

  context('under bypassDreamIntegrityChecks', () => {
    it('skips the compile at boot, and throws the same error when the shape is first checked, and every time after', async () => {
      const UncompilableShapeModel = jsonShapeModel({
        type: 'object',
        properties: { phone: { type: 'string', pattern: INVALID_UNDER_UNICODE_FLAG } },
      })

      await expect(
        bootWith([UncompilableShapeModel], { bypassDreamIntegrityChecks: true })
      ).resolves.toBeInstanceOf(DreamApp)

      for (let check = 0; check < 2; check++) {
        expect(() =>
          validateDeclaredShape(UncompilableShapeModel, 'jsonbData', { phone: '555-1234' })
        ).toThrow(ModelDeclaredShapeDoesNotCompile)
      }
      expect(() => validateDeclaredShape(UncompilableShapeModel, 'jsonbData', {})).toThrow(
        /@deco\.JSON on JsonShapeModel#jsonbData[\s\S]*Invalid regular expression/
      )
    })
  })
})
