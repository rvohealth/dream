import Dream from '../../../src/dream'
import User from '../../../test-app/app/models/user'
import Composition from '../../../test-app/app/models/composition'
import { ValidationError } from '../../../src'

describe('Dream.transaction', () => {
  it('completes all database actions within the transaction', async () => {
    const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })

    await Dream.transaction(async txn => {
      await Composition.txn(txn).create({ user })
      await user.txn(txn).update({ email: 'fred@fishman' })
    })

    expect(await Composition.count()).toEqual(1)
    const reloadedUser = await User.find(user.id)
    expect(user.email).toEqual('fred@fishman')
  })

  context('a DB action that raises an exception', () => {
    it('earlier DB actions within the transaction are not committed', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })

      await expect(
        Dream.transaction(async txn => {
          await Composition.txn(txn).create({ user })
          // @ts-ignore
          await user.txn(txn).update({ email: null })
        })
      ).rejects.toThrowError(ValidationError)

      expect(await Composition.count()).toEqual(0)
    })
  })
})
