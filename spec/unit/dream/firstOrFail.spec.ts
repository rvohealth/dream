import RecordNotFound from '../../../src/exceptions/record-not-found'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import User from '../../../test-app/app/models/User'

describe('Dream.firstOrFail', () => {
  it('finds the first record in the db, sorting by id', async () => {
    const u1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const results = await User.firstOrFail()
    expect(results.id).toEqual(u1.id)
  })

  context('the record is not found', () => {
    it('raises an exception', async () => {
      await expect(async () => await User.firstOrFail()).rejects.toThrow(RecordNotFound)
    })
  })

  context('when passed a transaction', () => {
    it('can find the first record within a transaction', async () => {
      let user: User | null = null
      await ApplicationModel.transaction(async txn => {
        await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        user = await User.txn(txn).firstOrFail()
      })
      expect(user!.email).toEqual('fred@frewd')
    })
  })
})
