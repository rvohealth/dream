import { Dream } from '../../../../src'
import Composition from '../../../../test-app/app/models/composition'
import User from '../../../../test-app/app/models/user'

describe('Dream AfterUpdateCommit decorator', () => {
  it('runs the query after the transactions have been commited', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

    // setting the content field to "override on commit" will cause the composition model to set
    // different content on this record on both AfterUpdate, and AfterUpdateCommit.
    const composition = await Composition.create({
      user_id: user.id,
    })
    await composition.update({
      content: 'change me after update commit',
    })
    expect(composition.content).toEqual('changed after update commit')
  })

  context('the entire statement is wrapped in a transaction', () => {
    it('runs commit hooks after transaction commits', async () => {
      let composition: Composition | null = null
      await Dream.transaction(async txn => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' }, txn)

        // setting the content field to "override on commit" will cause the composition model to set
        // different content on this record on both AfterUpdate, and AfterUpdateCommit.
        composition = await Composition.create({ user_id: user.id }, txn)
        await composition.update({
          content: 'change me after update commit',
        })
      })
      expect(composition!.content).toEqual('changed after update commit')
    })
  })
})
