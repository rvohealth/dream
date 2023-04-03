import User from '../../../src/test-app/app/models/user'

describe('Dream.create', () => {
  it('creates the underlying model in the db', async () => {
    const u = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    console.log(await User.find(u.id), u.id)
  })
})
