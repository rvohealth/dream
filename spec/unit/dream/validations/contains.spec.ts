import ValidationError from '../../../../src/exceptions/validation-error'
import User from '../../../../test-app/app/models/User'

describe('Dream contains validation', () => {
  it('builds scope mapping', async () => {
    const validation = User['validations'].find(v => v.column === 'email' && v.type === 'contains')!
    expect(validation.type).toEqual('contains')
    expect(validation.column).toEqual('email')
  })

  it('prevents saving when a field when the field does not match the clause specified by the contains validation', async () => {
    const user = User.new({ email: 'noatsign', password: 'howyadoin' })
    expect(user.isInvalid).toEqual(true)

    await expect(user.save()).rejects.toThrowError(ValidationError)

    expect(user.isPersisted).toEqual(false)
    expect(await User.count()).toEqual(0)
    expect(user.errors).toEqual({ email: ['contains'] })
  })

  it('does not raise an error when the field matches the validation', async () => {
    const user = User.new({ email: 'hi@hi', password: 'howyadoin' })
    expect(user.isInvalid).toEqual(false)
    await user.save()
    expect(user.isPersisted).toEqual(true)
  })
})
