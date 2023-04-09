import User from '../../../test-app/app/models/user'

describe('Dream.order', () => {
  it('correctly orders results', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const records = await User.order('id').all()
    expect(records[0].id).toEqual(user1.id)
    expect(records[1].id).toEqual(user2.id)
  })

  describe('when passed a direction', () => {
    it('correctly orders in the direction passed', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

      const records = await User.order('id', 'desc').all()
      expect(records[0].id).toEqual(user2.id)
      expect(records[1].id).toEqual(user1.id)
    })
  })
})
