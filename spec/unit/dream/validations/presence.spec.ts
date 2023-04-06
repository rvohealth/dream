import { ValidationError } from '../../../../src/dream'
import User from '../../../../src/test-app/app/models/user'

describe('Dream presence validation', () => {
  it('builds scope mapping', async () => {
    const emailPresenceValidation = User.validations[0]
    expect(emailPresenceValidation.type).toEqual('presence')
    expect(emailPresenceValidation.column).toEqual('email')
  })

  it('prevents saving when a field requiring presence is blank', async () => {
    const user = new User({ password: 'howyadoin' })
    expect(user.isInvalid).toEqual(true)

    expect(async () => {
      await user.save()
    }).rejects.toThrowError(ValidationError)

    expect(user.isPersisted).toEqual(false)
    expect(await User.count()).toEqual(0)
    expect(user.errors.email).toContain('presence')
  })
})
