import Composition from '../../../test-app/app/models/composition'
import User from '../../../test-app/app/models/user'

describe('Query#nestedSelect', () => {
  it('allows nested select statements', async () => {
    const user1 = await User.create({
      email: 'fred@frewd',
      password: 'howyadoin',
    })
    const user2 = await User.create({
      email: 'frez@frewd',
      password: 'howyadoin',
    })
    await User.create({
      email: 'frez@fishman',
      password: 'howyadoin',
    })

    const records = await User.where({
      id: User.where({ id: [user1.id, user2.id] }).nestedSelect('id'),
    }).all()
    expect(records).toMatchDreamModels([user1, user2])
  })
})
