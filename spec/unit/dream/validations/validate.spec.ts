import ValidationError from '../../../../src/exceptions/ValidationError'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar'
import Sandbag from '../../../../test-app/app/models/Sandbag'
import User from '../../../../test-app/app/models/User'

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
})
