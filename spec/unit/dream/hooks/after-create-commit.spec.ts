import { Dream } from '../../../../src'
import Composition from '../../../../test-app/app/models/composition'
import User from '../../../../test-app/app/models/user'

describe('Dream AfterCreateCommit decorator', () => {
  it('runs the query after the transactions have been commited', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

    // setting the content field to "override on commit" will cause the composition model to set
    // different content on this record on both AfterCreate, and AfterCreateCommit.
    const composition = await Composition.create({ user_id: user.id, content: 'change me after commit' })
    expect(composition.content).toEqual('changed after create commit')
  })

  context('the entire statement is wrapped in a transaction', () => {
    it.only('runs commit hooks after transaction commits', async () => {
      let composition: Composition | null = null
      await Dream.transaction(async txn => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' }, txn)

        // setting the content field to "override on commit" will cause the composition model to set
        // different content on this record on both AfterCreate, and AfterCreateCommit.
        composition = await Composition.create({ user_id: user.id, content: 'change me after commit' }, txn)
      })
      expect(composition!.content).toEqual('changed after create commit')
    })
  })
})
