import { Dream } from '../../../../src'
import Composition from '../../../../test-app/app/models/composition'
import User from '../../../../test-app/app/models/user'

describe('Dream AfterSaveCommit decorator', () => {
  context('creating', () => {
    it('runs the query after the transactions have been commited', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      // setting the content field to "override on commit" will cause the composition model to set
      // different content on this record on both AfterSave, and AfterSaveCommit.
      const composition = await Composition.create({
        user_id: user.id,
        content: 'change me after save commit',
      })
      expect(composition.content).toEqual('changed after save commit')
    })

    context('the entire statement is wrapped in a transaction', () => {
      it('runs commit hooks after transaction commits', async () => {
        let composition: Composition | null = null
        await Dream.transaction(async txn => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' }, txn)

          // setting the content field to "override on commit" will cause the composition model to set
          // different content on this record on both AfterSave, and AfterSaveCommit.
          composition = await Composition.create(
            { user_id: user.id, content: 'change me after save commit' },
            txn
          )
        })
        expect(composition!.content).toEqual('changed after save commit')
      })
    })
  })

  context('updating', () => {
    it('runs the query after the transactions have been commited', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      // setting the content field to "override on commit" will cause the composition model to set
      // different content on this record on both AfterUpdate, and AfterUpdateCommit.
      const composition = await Composition.create({
        user_id: user.id,
      })
      await composition.update({
        content: 'change me after save commit',
      })
      expect(composition.content).toEqual('changed after save commit')
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
            content: 'change me after save commit',
          })
        })
        expect(composition!.content).toEqual('changed after save commit')
      })
    })
  })
})
