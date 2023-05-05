import { Dream } from '../../../src'
import User from '../../../test-app/app/models/User'

describe('Dream.whereNot', () => {
  it('negates a query', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'danny@nelso', password: 'howyadoin' })
    const user3 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const records = await User.whereNot({ email: 'fred@frewd' }).all()
    expect(records).toMatchDreamModels([user2, user3])
  })

  context('when encased in a transaction', () => {
    it('negates a query', async () => {
      let user2: User | null = null
      let user3: User | null = null
      let records: User[] = []
      await Dream.transaction(async txn => {
        await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        user2 = await User.txn(txn).create({ email: 'danny@nelso', password: 'howyadoin' })
        user3 = await User.txn(txn).create({ email: 'how@yadoin', password: 'howyadoin' })
        records = await User.txn(txn).whereNot({ email: 'fred@frewd' }).all()
      })

      expect(records).toMatchDreamModels([user2, user3])
    })
  })
})
