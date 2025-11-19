import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import Sandbag from '../../../../test-app/app/models/Sandbag.js'
import User from '../../../../test-app/app/models/User.js'

describe('Dream AfterCreateCommit decorator', () => {
  it('runs the query after the transactions have been commited', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

    const composition = await Composition.create({
      userId: user.id,
      content: 'change me after create commit',
    })
    expect(composition.content).toEqual('changed after create commit')
  })

  context('the entire statement is wrapped in a transaction', () => {
    it('runs commit hooks after transaction commits', async () => {
      let composition: Composition | null = null
      await ApplicationModel.transaction(async txn => {
        const user = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        composition = await Composition.txn(txn).create({ user, content: 'change me after create commit' })
      })
      expect(composition!.content).toEqual('changed after create commit')
    })
  })

  context('with ifChanging set on hook decorator', () => {
    let mylar: Mylar

    beforeEach(async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      mylar = await Mylar.create({ user, color: 'red' })
    })

    context('one of the attributes specified in the "ifChanging" clause is changing to non-null', () => {
      it('calls hook', async () => {
        const spy = vi.spyOn(Sandbag.prototype, 'conditionalAfterCreateCommitHook')
        await mylar.createAssociation('sandbags', { weightKgs: 10 })

        expect(spy).toHaveBeenCalled()
      })

      context('in a transaction', () => {
        it('calls hook', async () => {
          const spy = vi.spyOn(Sandbag.prototype, 'conditionalAfterCreateCommitHook')
          await ApplicationModel.transaction(
            async txn => await mylar.txn(txn).createAssociation('sandbags', { weightKgs: 10 })
          )

          expect(spy).toHaveBeenCalled()
        })
      })
    })

    context('none of the attributes specified in the "ifChanging" clause are changing', () => {
      it('does not call the hook', async () => {
        const spy = vi.spyOn(Sandbag.prototype, 'conditionalAfterCreateCommitHook')
        await mylar.createAssociation('sandbags', { weight: 10 })

        expect(spy).not.toHaveBeenCalled()
      })

      context('in a transaction', () => {
        it('does not call the hook', async () => {
          const spy = vi.spyOn(Sandbag.prototype, 'conditionalAfterCreateCommitHook')
          await ApplicationModel.transaction(
            async txn => await mylar.txn(txn).createAssociation('sandbags', { weight: 10 })
          )

          expect(spy).not.toHaveBeenCalled()
        })
      })
    })
  })
})
