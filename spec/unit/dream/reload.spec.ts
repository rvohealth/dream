import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream#reload', () => {
  it('reloads the model', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const userInAnotherInstance = await User.find(user.id)
    await userInAnotherInstance!.update({ email: 'a@b.com' })
    await user.reload()

    expect(user.email).toEqual('a@b.com')
  })

  it('updates originalAttributes so changes() after a subsequent save reflects the reloaded state', async () => {
    const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const userInAnotherInstance = await User.find(user.id)
    await userInAnotherInstance!.update({ email: 'a@b.com' })
    await user.reload()

    await user.update({ email: 'new@new.com' })

    expect(user.changes()).toEqual(
      expect.objectContaining({
        email: { was: 'a@b.com', now: 'new@new.com' },
      })
    )
  })

  context('in a transaction', () => {
    it('reloads the model', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

      await ApplicationModel.transaction(async txn => {
        const userInAnotherInstance = await User.txn(txn).find(user.id)
        await userInAnotherInstance!.txn(txn).update({ email: 'a@b.com' })
        await user.txn(txn).reload()
        expect(user.email).toEqual('a@b.com')
      })
    })
  })
})
