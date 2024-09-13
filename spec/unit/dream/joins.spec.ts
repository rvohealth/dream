import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import Composition from '../../../test-app/app/models/Composition'
import User from '../../../test-app/app/models/User'

describe('Dream.joins', () => {
  it('joins a HasOne association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    await Composition.create({ userId: user.id, primary: true })

    const reloadedUsers = await User.innerJoin('mainComposition').all()
    expect(reloadedUsers).toMatchDreamModels([user])
  })

  context('when encased in a transaction', () => {
    it('joins a HasOne association', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      await Composition.create({ userId: user.id, primary: true })
      let reloadedUsers: User[]

      await ApplicationModel.transaction(async txn => {
        reloadedUsers = await User.txn(txn).innerJoin('mainComposition').all()
        expect(reloadedUsers).toMatchDreamModels([user])
      })
    })
  })
})
