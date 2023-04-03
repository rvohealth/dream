import User from '../../../src/test-app/app/models/user'

describe('Dream.find', () => {
  it('is able to locate records in the database', async () => {
    const u = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.find(u.id)
    expect(user.email).toEqual('fred@frewd')
  })
})
