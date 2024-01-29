import User from '../../../test-app/app/models/User'
import Composition from '../../../test-app/app/models/Composition'
import { Dream } from '../../../src'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'

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

      await ApplicationModel.transaction(async txn => {
        reloadedUsers = await User.txn(txn).joins('mainComposition').all()
        expect(reloadedUsers).toMatchDreamModels([user])
      })
    })

    // this is skipped, since it is only here to ensure that types are working
    // from args a-g, which does not actually need to be run, since if this is
    // broken, tests will fail to compile due to type errors
    it.skip('permits types a-g', async () => {
      await ApplicationModel.transaction(async txn => {
        User.txn(txn).joins('pets', 'collars', 'pet', 'collars', 'pet', 'collars', 'pet')
      })
    })
  })

  // this is skipped, since it is only here to ensure that types are working
  // from args a-g, which does not actually need to be run, since if this is
  // broken, tests will fail to compile due to type errors
  it.skip('permits types a-g', async () => {
    User.joins('pets', 'collars', 'pet', 'collars', 'pet', 'collars', 'pet')
  })
})
