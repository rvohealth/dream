import User from '../../../test-app/app/models/user'
import Composition from '../../../test-app/app/models/composition'

describe('Dream.transaction', () => {
  it('completes all database actions within the transaction', async () => {
    const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })

    await Dream.transaction(async txn => {
      await Composition.transaction(txn).create({ user })
      await user.transaction(txn).update({ email: 'fred@fishman' })
    })

    expect(await Composition.count()).toEqual(1)
  })

  context('a DB action that raises an exception', () => {
    it('earlier DB actions within the transaction are not committed', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })

      await expect(
        // @ts-ignore
        async () => {
          await Dream.transaction(async txn => {
            await Composition.transaction(txn).create({ user })
            await user.transaction(txn).update({ email: null })
          })
        }
      ).rejects.toThrowError(ValidationError)

      expect(await Composition.count()).toEqual(0)
    })
  })
})
