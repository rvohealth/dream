import User from '../../../test-app/app/models/User'

describe('Query#or', () => {
  it('allows compound or statements', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'danny@nelso', password: 'howyadoin' })
    const user3 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const records = await User.where({ email: 'fred@frewd' })
      .or(User.where({ id: user2.id }))
      .all()
    expect(records).toMatchDreamModels([user1, user2])
  })
})
