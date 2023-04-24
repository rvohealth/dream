import ValidationError from '../../../../src/exceptions/validation-error'
import User from '../../../../test-app/app/models/user'

describe('Dream length validation', () => {
  it('builds scope mapping', async () => {
    const validation = User.validations.find(v => v.column === 'password' && v.type === 'length')!
    expect(validation.type).toEqual('length')
    expect(validation.column).toEqual('password')
    expect(validation.options!.length!.min).toEqual(4)
    expect(validation.options!.length!.max).toEqual(18)
  })

  it('permits saving a record that passes length validations', async () => {
    const user = new User({ email: 'fred@', password: 'morethan4' })
    expect(user.isInvalid).toEqual(false)
  })

  it('prevents saving when a field requiring min length is less than the min length', async () => {
    const user = new User({ email: 'fred@', password: 'how' })
    expect(user.isInvalid).toEqual(true)

    await expect(async () => {
      await user.save()
    }).rejects.toThrowError(ValidationError)

    expect(user.isPersisted).toEqual(false)
    expect(await User.count()).toEqual(0)
    expect(user.errors.password).toContain('length')
  })

  it('prevents saving when a field requiring max length is greater than the max length', async () => {
    const user = new User({ email: 'fred@', password: 'sdjkfhsdjkfhjkshdfkjshdfkjhsdjkfhksjdhfksdjfhkjh' })
    expect(user.isInvalid).toEqual(true)

    await expect(async () => {
      await user.save()
    }).rejects.toThrowError(ValidationError)

    expect(user.isPersisted).toEqual(false)
    expect(await User.count()).toEqual(0)
    expect(user.errors.password).toContain('length')
  })
})
