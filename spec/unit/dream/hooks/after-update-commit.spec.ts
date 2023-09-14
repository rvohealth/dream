import ApplicationModel from '../../../../test-app/app/models/ApplicationModel'
import Composition from '../../../../test-app/app/models/Composition'
import User from '../../../../test-app/app/models/User'

describe('Dream AfterUpdateCommit decorator', () => {
  it('runs the query after the transactions have been commited', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

    const composition = await Composition.create({
      userId: user.id,
    })
    await composition.update({
      content: 'change me after update commit',
    })
    expect(composition.content).toEqual('changed after update commit')
  })

  context('the entire statement is wrapped in a transaction', () => {
    it('runs commit hooks after transaction commits', async () => {
      let composition: Composition | null = null
      await ApplicationModel.transaction(async txn => {
        const user = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })

        composition = await Composition.txn(txn).create({ userId: user.id })
        await composition.txn(txn).update({
          content: 'change me after update commit',
        })
      })
      expect(composition!.content).toEqual('changed after update commit')
    })
  })
})
