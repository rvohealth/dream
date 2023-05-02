import User from '../../../test-app/app/models/user'
import Composition from '../../../test-app/app/models/composition'
import { Dream } from '../../../src'

describe('Dream.where', () => {
  it('finds records matching specified conditions', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const records = await User.where({ email: 'fred@frewd' }).all()
    expect(records.length).toEqual(1)
    expect(records[0].id).toEqual(user1.id)
  })

  context('when encased in a transaction', () => {
    let user1: User | null = null
    let records: User[] = []
    it('finds records matching specified conditions', async () => {
      await Dream.transaction(async txn => {
        user1 = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        await User.txn(txn).create({ email: 'how@yadoin', password: 'howyadoin' })

        records = await User.txn(txn).where({ email: 'fred@frewd' }).all()
      })
      expect(records).toMatchDreamModels([user1])
    })
  })
})
