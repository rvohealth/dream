import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import User from '../../../test-app/app/models/User'

describe('Dream.first', () => {
  it('finds the first record in the db, sorting by id', async () => {
    const u1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const results = await User.first()
    expect(results!.id).toEqual(u1.id)
  })

  context('when passed a transaction', () => {
    it('can find the first record within a transaction', async () => {
      let user: User | null = null
      await ApplicationModel.transaction(async txn => {
        const u = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        user = await User.txn(txn).first()
      })
      expect(user!.email).toEqual('fred@frewd')
    })
  })
})
