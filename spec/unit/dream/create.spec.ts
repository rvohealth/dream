import User from '../../../test-app/app/models/user'

describe('Dream.create', () => {
  it('creates the underlying model in the db', async () => {
    const u = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.find(u.id)
    expect(user!.email).toEqual('fred@frewd')
    expect(typeof user!.id).toBe('number')
  })
})
