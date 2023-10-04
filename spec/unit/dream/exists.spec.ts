import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import User from '../../../test-app/app/models/User'

describe('Dream.first', () => {
  context('when no instances of the specified model exists', () => {
    it('return false', async () => {
      expect(await User.exists()).toBe(false)
    })
  })

  context('when at least one of the specified model exists', () => {
    it('return true', async () => {
      await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      expect(await User.exists()).toBe(true)
    })
  })

  context('when passed a transaction', () => {
    context('when no instances of the specified model exists', () => {
      it('return false', async () => {
        await ApplicationModel.transaction(async txn => {
          expect(await User.txn(txn).exists()).toBe(false)
        })
      })
    })

    context('when at least one of the specified model exists', () => {
      it('return true', async () => {
        await ApplicationModel.transaction(async txn => {
          await User.txn(txn).create({ email: 'fred@fishman', password: 'howyadoin' })
          expect(await User.txn(txn).exists()).toBe(true)
        })
      })
    })
  })
})
