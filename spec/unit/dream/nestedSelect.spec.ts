import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import User from '../../../test-app/app/models/User'

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
      email: 'frez@fishman',
      password: 'howyadoin',
    })

    const records = await User.where({
      id: User.nestedSelect('id'),
    }).all()
    expect(records).toMatchDreamModels([user1, user2, user3])
  })

  context('when encased in a transaction', () => {
    it('allows nested select statements', async () => {
      let records: User[] = []
      let user1: User | null = null
      let user2: User | null = null
      let user3: User | null = null
      await ApplicationModel.transaction(async txn => {
        user1 = await User.txn(txn).create({
          email: 'fred@frewd',
          password: 'howyadoin',
        })
        user2 = await User.txn(txn).create({
          email: 'frez@frewd',
          password: 'howyadoin',
        })
        user3 = await User.txn(txn).create({
          email: 'frez@fishman',
          password: 'howyadoin',
        })

        records = await User.txn(txn)
          .where({
            id: User.txn(txn).nestedSelect('id'),
          })
          .all()
      })

      expect(records).toMatchDreamModels([user1, user2, user3])
    })
  })
})
