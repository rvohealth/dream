import { ValidationError } from '../../../src'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import Composition from '../../../test-app/app/models/Composition'
import User from '../../../test-app/app/models/User'

describe('ApplicationModel.transaction', () => {
  it('completes all database actions within the transaction', async () => {
    const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })

    await ApplicationModel.transaction(async txn => {
      await Composition.txn(txn).create({ user })
      await user.txn(txn).update({ email: 'fred@fishman' })
    })

    expect(await Composition.count()).toEqual(1)
    await User.find(user.id)
    expect(user.email).toEqual('fred@fishman')
  })

  context('a DB action that raises an exception', () => {
    it('earlier DB actions within the transaction are not committed', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })

      await expect(
        ApplicationModel.transaction(async txn => {
          await Composition.txn(txn).create({ user })
          await user.txn(txn).update({ email: null } as any)
        })
      ).rejects.toThrowError(ValidationError)

      expect(await Composition.count()).toEqual(0)
    })
  })

  it(
    'records (with incrementing primary key) that fail to save within a transaction aren’t ' +
      'conflated with records successfully saved outside the transaction',
    async () => {
      let user: User | undefined

      try {
        await ApplicationModel.transaction(async txn => {
          user = await User.txn(txn).create({ email: 'fred@fred', password: 'howyadoin' })
          await User.txn(txn).create({ email: 'fred@fred', password: 'howyadoin' })
        })
      } catch {
        // no-op
      }

      const otherUser = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      expect(user?.id).not.toEqual(otherUser.id)
    }
  )
})
