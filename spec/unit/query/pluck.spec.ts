import User from '../../../test-app/app/models/user'

describe('Query#pluck', () => {
  let user1: User
  let user2: User
  beforeEach(async () => {
    user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
  })

  it('plucks the specified attributes and returns them as raw data', async () => {
    const records = await User.order('id').pluck('id')
    expect(records).toEqual([user1.id, user2.id])
  })

  context('with multiple fields', () => {
    it('should return multi-dimensional array', async () => {
      const records = await User.order('id').pluck('id', 'created_at')
      expect(records).toEqual([
        [user1.id, user1.created_at],
        [user2.id, user2.created_at],
      ])
    })
  })
})
