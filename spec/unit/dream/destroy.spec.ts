import { describe as context } from '@jest/globals'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import User from '../../../test-app/app/models/User'
import Pet from '../../../test-app/app/models/Pet'

describe('Dream#destroy', () => {
  it('destroys the record in question', async () => {
    const user = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
    const user2 = await User.create({ email: 'how@yadoin', name: 'howyadoin', password: 'hamz' })

    await user.destroy()
    expect(await User.count()).toEqual(1)
    expect((await User.first())!.getAttributes()).toEqual(user2.getAttributes())
  })

  it('calls model hooks', async () => {
    const pet = await Pet.create()
    await pet.destroy()
    expect(pet.deletedAt).not.toBeNull()
    expect(await Pet.count()).toEqual(0)
    expect(await Pet.unscoped().count()).toEqual(1)
  })

  context('skipHooks is passed', () => {
    it('skips model hooks', async () => {
      const pet = await Pet.create()
      await pet.destroy({ skipHooks: true })
      expect(await Pet.unscoped().count()).toEqual(0)
    })
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
