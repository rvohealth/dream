import User from '../../../test-app/app/models/User'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'

describe('Dream.count', () => {
  it('counts all records for a given model', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const results = await User.count()
    expect(results).toEqual(2)
  })

  context('when passed a transaction', () => {
    it('can report accurate count', async () => {
      let count: number = await User.count()
      expect(count).toEqual(0)

      await ApplicationModel.transaction(async txn => {
        await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        count = await User.txn(txn).count()
      })
      expect(count).toEqual(1)
    })
  })
})
