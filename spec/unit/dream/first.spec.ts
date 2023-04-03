import User from '../../../src/test-app/app/models/user'

describe('Dream.first', () => {
  it('finds the first record in the db, sorting by id', async () => {
    const u1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const results = await User.first()
    expect(results.id).toEqual(u1.id)
  })
})
