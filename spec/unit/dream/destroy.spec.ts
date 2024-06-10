import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import User from '../../../test-app/app/models/User'

describe('Dream#destroy', () => {
  it('destroys the record in question', async () => {
    const user = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
    const user2 = await User.create({ email: 'how@yadoin', name: 'howyadoin', password: 'hamz' })

    await user.destroy()
    expect(await User.count()).toEqual(1)

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect((await User.first())!.getAttributes()).toEqual(user2.getAttributes())
  })

  context('when passed a transaction', () => {
    it('can destroy within the transaction', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      let beforeFailureCount = 1

      try {
        await ApplicationModel.transaction(async txn => {
          await user.txn(txn).destroy()
          beforeFailureCount = await User.txn(txn).count()
          throw 'throwing to kill transaction'
        })
      } catch (err) {
        // noop
      }

      expect(beforeFailureCount).toEqual(0)
      expect(await User.count()).toEqual(1)
    })
  })
})
