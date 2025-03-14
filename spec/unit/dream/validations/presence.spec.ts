import ValidationError from '../../../../src/errors/ValidationError.js'
import User from '../../../../test-app/app/models/User.js'

describe('Dream presence validation', () => {
  it('builds scope mapping', () => {
    const validation = User['validations'].find(v => v.column === 'email' && v.type === 'presence')!
    expect(validation.type).toEqual('presence')
    expect(validation.column).toEqual('email')
  })

  it('prevents saving when a field requiring presence is blank', async () => {
    const user = User.new({ email: '', password: 'howyadoin' })
    expect(user.isInvalid).toEqual(true)

    await expect(user.save()).rejects.toThrow(ValidationError)

    expect(user.isPersisted).toEqual(false)
    expect(await User.count()).toEqual(0)
    expect(user.errors.email).toContain('presence')
  })
})
