import Decorators from '../../../../src/decorators/Decorators.js'
import ValidatesCannotDeclareRegisteredValidation from '../../../../src/errors/ValidatesCannotDeclareRegisteredValidation.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import processDynamicallyDefinedModels from '../../../helpers/processDynamicallyDefinedModels.js'

// `requiredBelongsTo` is registered by a @deco.BelongsTo that is not
// `optional`, so @deco.Validates refuses it: a type error, and an error when
// the models load at boot, never first at a save.
describe("@deco.Validates('requiredBelongsTo')", () => {
  const fix =
    /On a @deco\.BelongsTo association, drop `optional: true` from the BelongsTo[\s\S]*On any other property, remove the declaration\./

  it('on a property that is not a BelongsTo, is a type error and throws when the models load, naming the class and property', () => {
    const deco = new Decorators<typeof ValidatesRequiredName>()

    class ValidatesRequiredName extends ApplicationModel {
      public override get table() {
        return 'sti_bases' as const
      }

      // @ts-expect-error requiredBelongsTo is registered by @deco.BelongsTo
      @deco.Validates('requiredBelongsTo')
      public name: DreamColumn<ValidatesRequiredName, 'name'>
    }

    expect(() => processDynamicallyDefinedModels(ValidatesRequiredName)).toThrow(
      ValidatesCannotDeclareRegisteredValidation
    )
    expect(() => processDynamicallyDefinedModels(ValidatesRequiredName)).toThrow(
      /@deco\.Validates\('requiredBelongsTo'\) on ValidatesRequiredName#name/
    )
    expect(() => processDynamicallyDefinedModels(ValidatesRequiredName)).toThrow(fix)
  })

  it('on a BelongsTo declared optional, is a type error and throws when the models load, saying to drop `optional: true`', () => {
    const deco = new Decorators<typeof ValidatesRequiredOptionalPet>()

    class ValidatesRequiredOptionalPet extends ApplicationModel {
      public override get table() {
        return 'sti_bases' as const
      }

      // @ts-expect-error requiredBelongsTo is registered by @deco.BelongsTo
      @deco.Validates('requiredBelongsTo')
      @deco.BelongsTo('Pet', { on: 'petId', optional: true })
      public pet: Pet | null
      public petId: DreamColumn<ValidatesRequiredOptionalPet, 'petId'>
    }

    expect(() => processDynamicallyDefinedModels(ValidatesRequiredOptionalPet)).toThrow(
      /@deco\.Validates\('requiredBelongsTo'\) on ValidatesRequiredOptionalPet#pet/
    )
    expect(() => processDynamicallyDefinedModels(ValidatesRequiredOptionalPet)).toThrow(fix)
  })
})
