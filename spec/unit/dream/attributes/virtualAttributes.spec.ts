import User from '../../../../test-app/app/models/User'

describe('Dream#virtualAttributes', () => {
  it('returns the virtual attributes that are dirty', async () => {
    const user = await User.create({ email: 'ham@', password: 'howyadoin' })
    expect(await user.checkPassword('howyadoin')).toEqual(true)
  })
})
