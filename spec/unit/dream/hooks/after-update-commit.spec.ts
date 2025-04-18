import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import Sandbag from '../../../../test-app/app/models/Sandbag.js'
import User from '../../../../test-app/app/models/User.js'

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

  context('with ifChanging set on hook decorator', () => {
    let sandbag: Sandbag

    beforeEach(async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const mylar = await Mylar.create({ user, color: 'red' })
      sandbag = await mylar.createAssociation('sandbags', { weightTons: 10 })
    })

    context('one of the attributes specified in the "ifChanging" clause is changing', () => {
      it('calls hook', async () => {
        vi.spyOn(Sandbag.prototype, 'conditionalAfterUpdateCommitHook')
        await sandbag.update({ weightTons: 11 })

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(Sandbag.prototype.conditionalAfterUpdateCommitHook).toHaveBeenCalled()
      })

      context('in a transaction', () => {
        it('calls hook', async () => {
          vi.spyOn(Sandbag.prototype, 'conditionalAfterUpdateCommitHook')
          await ApplicationModel.transaction(async txn => await sandbag.txn(txn).update({ weightTons: 11 }))

          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(Sandbag.prototype.conditionalAfterUpdateCommitHook).toHaveBeenCalled()
        })
      })
    })

    context('none of the attributes specified in the "ifChanging" clause are changing', () => {
      it('does not call the hook', async () => {
        await sandbag.update({ weightTons: null })
        vi.spyOn(Sandbag.prototype, 'conditionalAfterUpdateCommitHook')
        await sandbag.update({ weightKgs: 120 })

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(Sandbag.prototype.conditionalAfterUpdateCommitHook).not.toHaveBeenCalled()
      })

      context('in a transaction', () => {
        it('does not call the hook', async () => {
          await sandbag.update({ weightTons: null })
          vi.spyOn(Sandbag.prototype, 'conditionalAfterUpdateCommitHook')

          await ApplicationModel.transaction(async txn => await sandbag.txn(txn).update({ weightKgs: 120 }))

          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(Sandbag.prototype.conditionalAfterUpdateCommitHook).not.toHaveBeenCalled()
        })
      })
    })
  })
})
