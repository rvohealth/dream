import User from '../../../test-app/app/models/User'
import Query from '../../../src/dream/query'

describe('Query#order', () => {
  it('orders records by id', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const records = await new Query(User).order('id', 'desc').all()
    expect(records[0].id).toEqual(user2.id)
    expect(records[1].id).toEqual(user1.id)
  })
})
