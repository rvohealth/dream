import User from '../../../test-app/app/models/User'

describe('Query#count', () => {
  it('counts query results', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
    const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'fred' })
    const user3 = await User.create({ email: 'how@fishman', password: 'howyadoin', name: 'zed' })

    const count = await User.where({ name: 'fred' }).count()
    expect(count).toEqual(2)
  })
})
