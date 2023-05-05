import User from '../../../test-app/app/models/User'

describe('Dream#changedAttributes', () => {
  it('returns the original values for attributes that are dirty', async () => {
    const user = User.new({ email: 'ham@', password: 'howyadoin' })
    await user.save()

    user.email = 'fish'
    expect(user.changedAttributes()).toEqual({ email: 'ham@' })

    user.email = 'ham@'
    expect(user.changedAttributes()).toEqual({})
  })
})
