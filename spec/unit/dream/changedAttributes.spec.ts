import User from '../../../test-app/app/models/user'

describe('Dream#changedAttributes', () => {
  it('returns the original values for attributes that are dirty', async () => {
    const user = User.new({ email: 'ham@', password: 'howyadoin' })
    // expect(user.changedAttributes).toEqual({ email: null, password: null })
    await user.save()

    user.email = 'ham@'
    expect(user.changedAttributes()).toEqual({})

    user.email = 'fish'
    expect(user.changedAttributes()).toEqual({ email: 'ham@' })

    user.email = 'ham@'
    expect(user.changedAttributes()).toEqual({})
  })
})
