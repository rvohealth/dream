import User from '../../../src/test-app/app/models/user'

describe('Dream.last', () => {
  it('finds the last record in the db, sorting by id', async () => {
    const u1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const u2 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const results = await User.last()
    expect(results!.id).toEqual(u2.id)
  })
})
