import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import User from '../../../test-app/app/models/User'

describe('Dream#reload', () => {
  it('reloads the model', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const userInAnotherInstance = await User.find(user.id)
    await userInAnotherInstance!.update({ email: 'a@b.com' })
    expect((await user.reload()).email).toEqual('a@b.com')
  })

  context('in a transaction', () => {
    it('reloads the model', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

      await ApplicationModel.transaction(async txn => {
        const userInAnotherInstance = await User.txn(txn).find(user.id)
        await userInAnotherInstance!.txn(txn).update({ email: 'a@b.com' })
        expect((await user.txn(txn).reload()).email).toEqual('a@b.com')
      })
    })
  })
})
