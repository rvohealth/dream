import { Dream } from '../../../src'
import User from '../../../test-app/app/models/User'

describe('Dream.order', () => {
  it('correctly orders results', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const records = await User.order('id').all()
    expect(records).toMatchDreamModels([user1, user2])
  })

  context('when encased in a transaction', () => {
    it('correctly orders results', async () => {
      let user1: User | null = null
      let user2: User | null = null
      let records: User[] = []
      await Dream.transaction(async txn => {
        user1 = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        user2 = await User.txn(txn).create({ email: 'how@yadoin', password: 'howyadoin' })
        records = await User.txn(txn).order('id').all()
      })
      expect(records).toMatchDreamModels([user1, user2])
    })
  })

  context('when passed a direction', () => {
    it('correctly orders in the direction passed', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

      const records = await User.order('id', 'desc').all()
      expect(records[0].id).toEqual(user2.id)
      expect(records[1].id).toEqual(user1.id)
    })
  })
})
