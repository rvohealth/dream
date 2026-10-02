import User from '../../../../test-app/app/models/User.js'

describe('Dream#dirtyAttributes', () => {
  it('includes only assigned columns on a new record, including null', () => {
    const user = User.new({ email: 'ham@', name: null })

    expect(user.dirtyAttributes()).toEqual({ email: 'ham@', name: null })
    expect(User.new().dirtyAttributes()).toEqual({})
  })

  it('includes copied columns on a duplicate', () => {
    const user = User.new({ email: 'ham@' }).dup()

    expect(user.dirtyAttributes()).toEqual({ email: 'ham@' })
  })

  it('returns attributes that are dirty', async () => {
    const user = User.new({ email: 'ham@', password: 'howyadoin' })
    expect(user.dirtyAttributes()).toEqual(expect.objectContaining({ email: 'ham@' }))
    await user.save()

    user.email = 'ham@'
    expect(user.dirtyAttributes()).toEqual({})

    user.email = 'fish'
    expect(user.dirtyAttributes()).toEqual({ email: 'fish' })

    user.email = 'ham@'
    expect(user.dirtyAttributes()).toEqual({})
  })
})
