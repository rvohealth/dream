import Decorators from '../../../../src/decorators/Decorators.js'
import ValidatesCannotDeclareRegisteredValidation from '../../../../src/errors/ValidatesCannotDeclareRegisteredValidation.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import processDynamicallyDefinedModels from '../../../helpers/processDynamicallyDefinedModels.js'

// `declaredShape` is registered by @deco.JSON and @deco.Encrypted, so
// @deco.Validates refuses it: a type error, and an error when the models load
// at boot, never first at a save.
describe("@deco.Validates('declaredShape')", () => {
  it('is a type error, and throws when the models load, naming the class and property and saying what to do', () => {
    const deco = new Decorators<typeof ValidatesDeclaredShape>()

    class ValidatesDeclaredShape extends ApplicationModel {
      public override get table() {
        return 'model_for_openapi_type_specs' as const
      }

      // @ts-expect-error declaredShape is registered by @deco.JSON and @deco.Encrypted
      @deco.Validates('declaredShape')
      public jsonbData: DreamColumn<ValidatesDeclaredShape, 'jsonbData'>
    }

    expect(() => processDynamicallyDefinedModels(ValidatesDeclaredShape)).toThrow(
      ValidatesCannotDeclareRegisteredValidation
    )
    expect(() => processDynamicallyDefinedModels(ValidatesDeclaredShape)).toThrow(
      /@deco\.Validates\('declaredShape'\) on ValidatesDeclaredShape#jsonbData[\s\S]*@deco\.JSON and @deco\.Encrypted register it[\s\S]*Remove the @deco\.Validates\('declaredShape'\) declaration/
    )
  })
})
