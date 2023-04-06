import User from '../../../src/test-app/app/models/user'

describe('Query#where', () => {
  it('orders records by id', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const records = await User.limit(1).where({ email: 'fred@frewd' }).all()
    expect(records.length).toEqual(1)
    expect(records[0].id).toEqual(user1.id)
  })
})
