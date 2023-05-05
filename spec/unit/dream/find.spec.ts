import Dream from '../../../src/dream'
import User from '../../../test-app/app/models/User'

describe('Dream.find', () => {
  it('is able to locate records in the database', async () => {
    const u = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.find(u.id)
    expect(user!.email).toEqual('fred@frewd')
  })

  context('when passed a transaction', () => {
    it('can find records', async () => {
      let user: User | null = null
      await Dream.transaction(async txn => {
        const u = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        user = await User.txn(txn).find(u.id)
      })
      expect(user!.email).toEqual('fred@frewd')
    })
  })
})
