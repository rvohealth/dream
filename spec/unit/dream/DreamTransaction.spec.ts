import { sql } from 'kysely'
import DreamTransaction from '../../../src/dream/DreamTransaction.js'
import { DateTime } from '../../../src/utils/datetime/DateTime.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../test-app/app/models/Composition.js'
import SortableCascadeChild from '../../../test-app/app/models/SortableCascadeChild.js'
import SortableCascadeOwner from '../../../test-app/app/models/SortableCascadeOwner.js'
import User from '../../../test-app/app/models/User.js'

describe('DreamTransaction#isCommitted', () => {
  it('is true after the transaction commits, even when a commit hook then throws', async () => {
    const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
    vi.spyOn(Composition.prototype, 'conditionallyChangeContentOnCreateCommit').mockImplementation(() => {
      throw new Error('raised by a commit hook')
    })
    let transaction = null as DreamTransaction<any> | null

    await expect(
      ApplicationModel.transaction(async txn => {
        transaction = txn
        await Composition.txn(txn).create({ user })
      })
    ).rejects.toThrow('raised by a commit hook')

    expect(transaction!.isCommitted).toBe(true)
    expect(await Composition.count()).toEqual(1)
  })

  it('is false when the transaction callback throws before COMMIT', async () => {
    let transaction = null as DreamTransaction<any> | null

    await expect(
      ApplicationModel.transaction(async txn => {
        transaction = txn
        await User.txn(txn).create({ email: 'fred@fred', password: 'howyadoin' })
        throw new Error('raised by the callback')
      })
    ).rejects.toThrow('raised by the callback')

    expect(transaction!.isCommitted).toBe(false)
    expect(await User.count()).toEqual(0)
  })

  it('is false when the callback catches a failed statement and returns normally', async () => {
    let transaction = null as DreamTransaction<any> | null

    await expect(
      ApplicationModel.transaction(async txn => {
        transaction = txn
        await User.txn(txn).create({ email: 'fred@fred', password: 'howyadoin' })
        try {
          await sql`select 1 / 0`.execute(txn.kyselyTransaction)
        } catch {
          // the caller swallows the failed statement
        }
      })
    ).rejects.toThrow(/current transaction is aborted/)

    expect(transaction!.isCommitted).toBe(false)
    expect(await User.count()).toEqual(0)
  })

  it('is false when the database refuses the COMMIT', async () => {
    const owner = await SortableCascadeOwner.create()
    let transaction = null as DreamTransaction<any> | null

    // the deferrable unique constraint on (owner_id, position) refuses these
    // two rows only at COMMIT
    await expect(
      ApplicationModel.transaction(async txn => {
        transaction = txn
        for (let i = 0; i < 2; i++) {
          await txn.kyselyTransaction
            .insertInto('sortable_cascade_children')
            .values({
              ownerId: owner.id,
              label: 'a',
              position: 1,
              createdAt: DateTime.now(),
              updatedAt: DateTime.now(),
            })
            .execute()
        }
      })
    ).rejects.toThrow(/duplicate key value/)

    expect(transaction!.isCommitted).toBe(false)
    expect(await SortableCascadeChild.count()).toEqual(0)
  })
})
