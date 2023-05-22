import User from '../../../test-app/app/models/User'
import Query from '../../../src/dream/query'

describe('Query#whereNot', () => {
  it('negates a query', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'danny@nelso', password: 'howyadoin' })
    const user3 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const records = await new Query(User).whereNot({ email: 'fred@frewd' }).all()
    expect(records).toMatchDreamModels([user2, user3])
  })
})
