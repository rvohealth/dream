import User from '../../../test-app/app/models/user'

describe('Query#limit', () => {
  it('limits number of records returned', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const records = await User.order('id').limit(2).all()
    expect(records[0].id).toEqual(user1.id)
    expect(records[1].id).toEqual(user2.id)
  })
})
