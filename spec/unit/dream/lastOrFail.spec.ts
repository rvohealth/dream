import RecordNotFound from '../../../src/exceptions/record-not-found'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import User from '../../../test-app/app/models/User'

describe('Dream.last', () => {
  it('finds the last record in the db, sorting by id', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const u2 = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const results = await User.lastOrFail()
    expect(results.id).toEqual(u2.id)
  })

  context('the record is not found', () => {
    it('raises an exception', async () => {
      await expect(User.lastOrFail()).rejects.toThrow(RecordNotFound)
    })
  })

  context('when passed a transaction', () => {
    it('can find the last record within a transaction', async () => {
      let user: User | null = null
      await ApplicationModel.transaction(async txn => {
        await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        await User.txn(txn).create({ email: 'fred@frewd2', password: 'howyadoin' })
        user = await User.txn(txn).lastOrFail()
      })
      expect(user!.email).toEqual('fred@frewd2')
    })
  })
})
