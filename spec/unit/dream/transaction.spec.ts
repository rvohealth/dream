import { sql } from 'kysely'
import ValidationError from '../../../src/errors/ValidationError.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../test-app/app/models/Composition.js'
import User from '../../../test-app/app/models/User.js'

describe('ApplicationModel.transaction', () => {
  it('completes all database actions within the transaction', async () => {
    const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })

    await ApplicationModel.transaction(async txn => {
      await Composition.txn(txn).create({ user })
      await user.txn(txn).update({ email: 'fred@fishman' })
    })

    expect(await Composition.count()).toEqual(1)
    await User.find(user.id)
    expect(user.email).toEqual('fred@fishman')
  })

  it('txn can receive null', async () => {
    const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })

    await Composition.txn(null).create({ user })
    await user.txn(null).update({ email: 'fred@fishman' })

    expect(await Composition.count()).toEqual(1)
    await User.find(user.id)
    expect(user.email).toEqual('fred@fishman')
  })

  it('returns whatever was returned in the underlying callback', async () => {
    const res = await ApplicationModel.transaction(async txn => {
      await User.txn(txn).first()
      return 'howyadoin'
    })
    expect(res).toEqual('howyadoin')
  })

  context('a callback that catches a failed statement and returns normally', () => {
    it("rejects with the database's aborted-transaction error, persists nothing and runs no commit hooks", async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const commitHookSpy = vi.spyOn(Composition.prototype, 'conditionallyChangeContentOnCreateCommit')

      await expect(
        ApplicationModel.transaction(async txn => {
          await Composition.txn(txn).create({ user })
          try {
            await sql`select 1 / 0`.execute(txn.kyselyTransaction)
          } catch {
            // the caller swallows the failed statement
          }
        })
      ).rejects.toThrow(/current transaction is aborted/)

      expect(await Composition.count()).toEqual(0)
      expect(commitHookSpy).not.toHaveBeenCalled()
    })
  })

  context('a DB action that raises an exception', () => {
    it('earlier DB actions within the transaction are not committed', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })

      await expect(
        ApplicationModel.transaction(async txn => {
          await Composition.txn(txn).create({ user })
          await user.txn(txn).update({ email: null } as any)
        })
      ).rejects.toThrow(ValidationError)

      expect(await Composition.count()).toEqual(0)
    })
  })
})
