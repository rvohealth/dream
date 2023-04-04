import User from '../../../src/test-app/app/models/user'

describe('Dream#dirtyAttributes', () => {
  it('returns attributes that are dirty', async () => {
    const user = new User({ email: 'ham' })
    expect(user.dirtyAttributes).toEqual({})

    user.email = 'ham'
    expect(user.dirtyAttributes).toEqual({})

    user.email = 'fish'
    expect(user.dirtyAttributes).toEqual({ email: 'fish' })

    user.email = 'ham'
    expect(user.dirtyAttributes).toEqual({})
  })
})
