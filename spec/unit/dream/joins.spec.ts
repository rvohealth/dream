import User from '../../../test-app/app/models/User'
import Composition from '../../../test-app/app/models/Composition'
import { Dream } from '../../../src'

describe('Dream.joins', () => {
  it('joins a HasOne association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ userId: user.id, primary: true })

    const reloadedUsers = await User.joins('mainComposition').all()
    expect(reloadedUsers).toMatchDreamModels([user])
  })

  context('when encased in a transaction', () => {
    it('joins a HasOne association', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ userId: user.id, primary: true })
      let reloadedUsers: User[]

      await Dream.transaction(async txn => {
        reloadedUsers = await User.txn(txn).joins('mainComposition').all()
        expect(reloadedUsers).toMatchDreamModels([user])
      })
    })
  })
})
