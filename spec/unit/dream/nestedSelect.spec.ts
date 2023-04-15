import User from '../../../test-app/app/models/user'

describe('Dream#nestedSelect', () => {
  it('allows nested select statements', async () => {
    const user1 = await User.create({
      email: 'fred@frewd',
      password: 'howyadoin',
    })
    const user2 = await User.create({
      email: 'frez@frewd',
      password: 'howyadoin',
    })
    const user3 = await User.create({
      email: 'frez@frewd',
      password: 'howyadoin',
    })

    const records = await User.where({
      id: User.nestedSelect('id'),
    }).all()
    expect(records).toMatchObject([user1, user2, user3])
  })
})
