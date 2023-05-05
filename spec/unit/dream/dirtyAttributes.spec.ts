import User from '../../../test-app/app/models/User'

describe('Dream#dirtyAttributes', () => {
  it('returns attributes that are dirty', async () => {
    const user = User.new({ email: 'ham@', password: 'howyadoin' })
    expect(user.dirtyAttributes()).toEqual({ email: 'ham@', password: 'howyadoin' })
    await user.save()

    user.email = 'ham@'
    expect(user.dirtyAttributes()).toEqual({})

    user.email = 'fish'
    expect(user.dirtyAttributes()).toEqual({ email: 'fish' })

    user.email = 'ham@'
    expect(user.dirtyAttributes()).toEqual({})
  })
})
