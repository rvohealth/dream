import ValidationError from '../../../../src/errors/ValidationError.js'
import User from '../../../../test-app/app/models/User.js'

describe('Dream length validation', () => {
  it('builds scope mapping', () => {
    const validation = User['validations'].find(v => v.column === 'email' && v.type === 'length')!
    expect(validation.type).toEqual('length')
    expect(validation.column).toEqual('email')
    expect(validation.options!.length!.min).toEqual(4)
    expect(validation.options!.length!.max).toEqual(64)
  })

  it('permits saving a record that passes length validations', () => {
    const user = User.new({ email: 'fred@', password: 'morethan4' })
    expect(user.isInvalid).toEqual(false)
  })

  it('prevents saving when a field requiring min length is less than the min length', async () => {
    const user = User.new({ email: 'f@f', password: 'howyadoin' })
    expect(user.isInvalid).toEqual(true)

    await expect(user.save()).rejects.toThrow(ValidationError)

    expect(user.isPersisted).toEqual(false)
    expect(await User.count()).toEqual(0)
    expect(user.errors.email).toContain('length')
  })

  it('prevents saving when a field requiring max length is greater than the max length', async () => {
    const user = User.new({
      email: 'fred@lskdjfklsdjfklsjdfkljsdfkljsdklfjskldjfklsjfklsjdfklsjdkfljsdklfj',
      password: 'howyadoin',
    })
    expect(user.isInvalid).toEqual(true)

    await expect(user.save()).rejects.toThrow(ValidationError)

    expect(user.isPersisted).toEqual(false)
    expect(await User.count()).toEqual(0)
    expect(user.errors.email).toContain('length')
  })
})
