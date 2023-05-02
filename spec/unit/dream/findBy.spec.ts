import { Dream } from '../../../src'
import User from '../../../test-app/app/models/user'

describe('Dream.findBy', () => {
  it('is able to locate records in the database by the attributes passed', async () => {
    const u = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.findBy({ id: u.id, email: 'fred@frewd' })
    expect(user!.email).toEqual('fred@frewd')
  })

  context('when passed a transaction', () => {
    it('can find records', async () => {
      let user: User | null = null
      await Dream.transaction(async txn => {
        const u = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        user = await User.txn(txn).findBy({ id: u.id })
      })
      expect(user!.email).toEqual('fred@frewd')
    })
  })
})
