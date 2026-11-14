import STI from '../../../../src/decorators/class/STI.js'
import Decorators from '../../../../src/decorators/Decorators.js'
import ValidationError from '../../../../src/errors/ValidationError.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import Sandbag from '../../../../test-app/app/models/Sandbag.js'
import User from '../../../../test-app/app/models/User.js'
import processDynamicallyDefinedModels from '../../../helpers/processDynamicallyDefinedModels.js'

describe('Dream "validate" validation (the "validate" decorator is used to run custom validations)', () => {
  it('builds scope mapping', () => {
    expect(Sandbag['customValidations']).toEqual(expect.arrayContaining(['validateWeight']))
  })

  it('prevents saving when a field when custom function applies errors', async () => {
    const user = await User.create({ email: 'hi@hi', password: 'howyadoin' })
    const mylar = await Mylar.create({ user })
    const sandbag = Sandbag.new({ mylar, weight: 100, weightKgs: 0 })
    expect(sandbag.isInvalid).toEqual(true)

    await expect(sandbag.save()).rejects.toThrow(ValidationError)

    expect(sandbag.isPersisted).toEqual(false)
    expect(await Sandbag.count()).toEqual(0)
    expect(sandbag.errors).toEqual({ weight: ['cannot include weightKgs AND weight'] })
  })

  it('does not raise an error when the custom validation does not apply any errors', async () => {
    const user = await User.create({ email: 'hi@hi', password: 'howyadoin' })
    const mylar = await Mylar.create({ user })
    const sandbag = Sandbag.new({ mylar, weight: 100 })
    expect(sandbag.isInvalid).toEqual(false)
    await sandbag.save()
    expect(sandbag.isPersisted).toEqual(true)
  })

  it('runs a custom validation declared on an STI base once on a child when the base is initialized first', () => {
    const deco = new Decorators<typeof CheckedBase>()

    class CheckedBase extends ApplicationModel {
      public override get table() {
        return 'sti_bases' as const
      }

      public id: DreamColumn<CheckedBase, 'id'>
      public name: DreamColumn<CheckedBase, 'name'>

      @deco.Validate()
      public requireName(this: CheckedBase) {
        if (!this.name) this.addError('name', 'is required')
      }
    }

    @STI(CheckedBase)
    class CheckedChild extends CheckedBase {}

    processDynamicallyDefinedModels(CheckedBase, CheckedChild)

    const child = CheckedChild.new({})
    expect(child.isInvalid).toBe(true)
    expect(child.errors).toEqual({ name: ['is required'] })
  })

  it('runs a custom validation once on a model initialized a second time', () => {
    const deco = new Decorators<typeof CheckedModel>()

    class CheckedModel extends ApplicationModel {
      public override get table() {
        return 'sti_bases' as const
      }

      public id: DreamColumn<CheckedModel, 'id'>
      public name: DreamColumn<CheckedModel, 'name'>

      @deco.Validate()
      public requireName(this: CheckedModel) {
        if (!this.name) this.addError('name', 'is required')
      }
    }

    processDynamicallyDefinedModels(CheckedModel)
    processDynamicallyDefinedModels(CheckedModel)

    const model = CheckedModel.new({})
    expect(model.isInvalid).toBe(true)
    expect(model.errors).toEqual({ name: ['is required'] })
  })
})
