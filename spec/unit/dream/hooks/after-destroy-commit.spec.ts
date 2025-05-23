import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset.js'
import User from '../../../../test-app/app/models/User.js'

describe('Dream AfterDestroyCommit decorator', () => {
  it('runs the query after the transactions have been commited', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user, content: 'howyadoin' })
    const compositionAsset = await CompositionAsset.create({
      composition,
      src: 'mark after destroy commit',
    })

    await compositionAsset.destroy()
    await composition.reload()

    expect(composition.content).toEqual('changed after destroy commit of composition asset')
  })

  context('the entire statement is wrapped in a transaction', () => {
    it('runs commit hooks after transaction commits', async () => {
      let composition: Composition | null = null
      await ApplicationModel.transaction(async txn => {
        const user = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        composition = await Composition.txn(txn).create({ user, content: 'howyadoin' })
        const compositionAsset = await CompositionAsset.txn(txn).create({
          composition,
          src: 'mark after destroy commit',
        })

        await compositionAsset.txn(txn).destroy()
      })
      await composition!.reload()
      expect(composition!.content).toEqual('changed after destroy commit of composition asset')
    })
  })
})
