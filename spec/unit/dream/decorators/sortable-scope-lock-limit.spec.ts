import { sql } from 'kysely'
import acquireSortableScopeLocks from '../../../../src/decorators/field/sortable/helpers/acquireSortableScopeLocks.js'
import DreamTransaction from '../../../../src/dream/DreamTransaction.js'
import PostgresQueryDriver from '../../../../src/dream/QueryDriver/Postgres.js'
import DreamApp from '../../../../src/dream-app/index.js'
import * as errorExports from '../../../../src/package-exports/errors.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Latex from '../../../../test-app/app/models/Balloon/Latex.js'
import MysqlUser from '../../../../test-app/app/models/MysqlUser.js'
import TextScopedSortableModel from '../../../../test-app/app/models/TextScopedSortableModel.js'
import UnscopedSortableModel from '../../../../test-app/app/models/UnscopedSortableModel.js'
import User from '../../../../test-app/app/models/User.js'
import testDb from '../../../helpers/testDb.js'

function deferred() {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, reject, resolve }
}

async function captureError(callback: () => Promise<unknown>): Promise<Error> {
  try {
    await callback()
  } catch (error) {
    return error as Error
  }
  throw new Error('Expected callback to throw')
}

describe('the transaction-wide Sortable scope-lock ceiling', () => {
  let priorLimit: number

  beforeEach(() => {
    priorLimit = DreamApp.getOrFail().sortableMaxScopeLocksPerTransaction
  })

  afterEach(() => {
    DreamApp.getOrFail().set('sortableMaxScopeLocksPerTransaction', priorLimit)
  })

  context('central acquisition admission', () => {
    it('admits the exact boundary across repeated operations and deduplicates held keys', async () => {
      DreamApp.getOrFail().set('sortableMaxScopeLocksPerTransaction', 3)
      const acquisitions = vi
        .spyOn(PostgresQueryDriver, 'acquireAdvisoryTransactionLocks')
        .mockResolvedValue()
      const dream = UnscopedSortableModel.new()

      await ApplicationModel.transaction(async txn => {
        await acquireSortableScopeLocks(dream, txn, [1n, 2n])
        await acquireSortableScopeLocks(dream, txn, [2n, 3n])

        const error = await captureError(async () => await acquireSortableScopeLocks(dream, txn, [4n]))
        expect(error.message).toContain('would make this transaction hold 4 distinct Sortable scope locks')
        expect(error.message).toContain('configured limit is 3')
      })

      expect(acquisitions).toHaveBeenNthCalledWith(1, expect.any(DreamTransaction), [1n, 2n])
      expect(acquisitions).toHaveBeenNthCalledWith(2, expect.any(DreamTransaction), [3n])
      expect(acquisitions).toHaveBeenCalledTimes(2)
    })

    it('atomically counts reservations made by concurrent operations', async () => {
      DreamApp.getOrFail().set('sortableMaxScopeLocksPerTransaction', 1)
      const firstAcquisition = deferred()
      const acquisitions = vi
        .spyOn(PostgresQueryDriver, 'acquireAdvisoryTransactionLocks')
        .mockReturnValue(firstAcquisition.promise)
      const dream = UnscopedSortableModel.new()

      await ApplicationModel.transaction(async txn => {
        const first = acquireSortableScopeLocks(dream, txn, [1n])
        await vi.waitFor(() => expect(acquisitions).toHaveBeenCalledTimes(1))

        await expect(acquireSortableScopeLocks(dream, txn, [2n])).rejects.toThrow(
          'would make this transaction hold 2 distinct Sortable scope locks'
        )

        firstAcquisition.resolve()
        await first
      })

      expect(acquisitions).toHaveBeenCalledTimes(1)
    })

    it('makes a duplicate in-flight request await the same acquisition', async () => {
      DreamApp.getOrFail().set('sortableMaxScopeLocksPerTransaction', 1)
      const firstAcquisition = deferred()
      const acquisitions = vi
        .spyOn(PostgresQueryDriver, 'acquireAdvisoryTransactionLocks')
        .mockReturnValue(firstAcquisition.promise)
      const dream = UnscopedSortableModel.new()

      await ApplicationModel.transaction(async txn => {
        let duplicateSettled = false
        const first = acquireSortableScopeLocks(dream, txn, [1n])
        const duplicate = acquireSortableScopeLocks(dream, txn, [1n]).finally(() => {
          duplicateSettled = true
        })

        await vi.waitFor(() => expect(acquisitions).toHaveBeenCalledTimes(1))
        expect(duplicateSettled).toBe(false)

        firstAcquisition.resolve()
        await Promise.all([first, duplicate])
      })

      expect(acquisitions).toHaveBeenCalledTimes(1)
    })

    it('does not double-count a promoted in-flight key before cleanup', async () => {
      DreamApp.getOrFail().set('sortableMaxScopeLocksPerTransaction', 2)
      const firstAcquisition = deferred()
      const acquisitions = vi
        .spyOn(PostgresQueryDriver, 'acquireAdvisoryTransactionLocks')
        .mockReturnValueOnce(firstAcquisition.promise)
        .mockResolvedValueOnce()
      const dream = UnscopedSortableModel.new()

      await ApplicationModel.transaction(async txn => {
        const first = acquireSortableScopeLocks(dream, txn, [1n])
        await vi.waitFor(() => expect(acquisitions).toHaveBeenCalledTimes(1))

        const second = firstAcquisition.promise.then(
          async () => await acquireSortableScopeLocks(dream, txn, [2n])
        )
        firstAcquisition.resolve()

        await expect(second).resolves.toBeUndefined()
        await first
      })

      expect(acquisitions).toHaveBeenNthCalledWith(1, expect.any(DreamTransaction), [1n])
      expect(acquisitions).toHaveBeenNthCalledWith(2, expect.any(DreamTransaction), [2n])
      expect(acquisitions).toHaveBeenCalledTimes(2)
    })

    it('does not retain a failed acquisition as held or in flight', async () => {
      DreamApp.getOrFail().set('sortableMaxScopeLocksPerTransaction', 1)
      const failure = new Error('driver acquisition failed')
      const acquisitions = vi
        .spyOn(PostgresQueryDriver, 'acquireAdvisoryTransactionLocks')
        .mockRejectedValueOnce(failure)
        .mockResolvedValueOnce()
      const dream = UnscopedSortableModel.new()

      await ApplicationModel.transaction(async txn => {
        const first = acquireSortableScopeLocks(dream, txn, [1n])
        const duplicate = acquireSortableScopeLocks(dream, txn, [1n])

        await expect(first).rejects.toBe(failure)
        await expect(duplicate).rejects.toBe(failure)
        await expect(acquireSortableScopeLocks(dream, txn, [1n])).resolves.toBeUndefined()
      })

      expect(acquisitions).toHaveBeenCalledTimes(2)
    })
  })

  context('operation-specific failures', () => {
    it('gives permanent corrective guidance for a caller-owned transaction', async () => {
      DreamApp.getOrFail().set('sortableMaxScopeLocksPerTransaction', 1)
      const dream = UnscopedSortableModel.new()

      const error = await captureError(async () => {
        await ApplicationModel.transaction(async txn => {
          await acquireSortableScopeLocks(dream, txn, [1n, 2n])
        })
      })

      expect(error.message).toContain('The acquisition was refused before adding its 2 newly requested locks')
      expect(error.message).toContain('transaction you opened')
      expect(error.message).toContain('Loops across many Sortable scopes are a common cause')
      expect(error.message).toContain('must end')
      expect(error.message).toContain('permanently reduce the transaction breadth')
      expect(error.message).toContain('Do not catch this specific ceiling failure as an ongoing retry')
      expect(error.message).toContain('sortableMaxScopeLocksPerTransaction')
    })

    it('aborts and rolls back a Dream-opened non-batch create with operation guidance', async () => {
      const user = await User.create({ email: 'limit-create@example.com', password: 'password' })
      DreamApp.getOrFail().set('sortableMaxScopeLocksPerTransaction', 1)

      const error = await captureError(async () => await Latex.create({ user }))

      expect(error.message).toContain('Dream aborts this create transaction')
      expect(error.message).toContain('reduce the create or cascade breadth')
      expect(error.message).not.toContain('smaller batchSize')
      expect(await Latex.where({ userId: user.id }).count()).toEqual(0)
    })

    it('applies the same ceiling to Dream-opened saves, destroys, and undestroys', async () => {
      const user = await User.create({ email: 'limit-mutations@example.com', password: 'password' })
      const saved = await Latex.create({ user })
      await Latex.create({ user })

      DreamApp.getOrFail().set('sortableMaxScopeLocksPerTransaction', 1)
      const saveError = await captureError(
        async () => await saved.update({ positionAlpha: 2, positionBeta: 2 })
      )
      expect(saveError.message).toContain('Dream aborts this save transaction')
      expect((await Latex.findOrFail(saved.id)).positionAlpha).toEqual(1)

      const destroyError = await captureError(async () => await saved.destroy())
      expect(destroyError.message).toContain('Dream aborts this destroy transaction')
      expect(await Latex.where({ id: saved.id }).exists()).toBe(true)

      DreamApp.getOrFail().set('sortableMaxScopeLocksPerTransaction', priorLimit)
      await saved.destroy()
      DreamApp.getOrFail().set('sortableMaxScopeLocksPerTransaction', 1)

      const undestroyError = await captureError(async () => await saved.undestroy())
      expect(undestroyError.message).toContain('Dream aborts this undestroy transaction')
      expect(await Latex.where({ id: saved.id }).exists()).toBe(false)
    })

    it('allows resort to acquire each self-opened transaction at the exact boundary', async () => {
      const user = await User.create({ email: 'limit-resort@example.com', password: 'password' })
      await Latex.create({ user })
      DreamApp.getOrFail().set('sortableMaxScopeLocksPerTransaction', 1)

      await expect(Latex.resort('positionAlpha')).resolves.toBeUndefined()
    })

    it('aborts and rolls back a Dream-opened locked batch with batch guidance', async () => {
      await sql`
        insert into text_scoped_sortable_models (scope_a, scope_b, position, created_at, updated_at)
        values ('a', 'one', 1, now(), now()), ('b', 'two', 1, now(), now())
      `.execute(testDb('default', 'primary'))
      DreamApp.getOrFail().set('sortableMaxScopeLocksPerTransaction', 1)

      const error = await captureError(
        async () => await TextScopedSortableModel.query().destroy({ lock: true, batchSize: 2 })
      )

      expect(error.message).toContain('Dream aborts this locked batch transaction')
      expect(error.message).toContain('Configure a smaller batchSize')
      expect(await TextScopedSortableModel.count()).toEqual(2)
    })
  })

  context('public and adapter error contracts', () => {
    it('does not export either ceiling-error name or a retry predicate', () => {
      expect(errorExports).not.toHaveProperty('SortableBatchRequiresTooManyScopeLocks')
      expect(errorExports).not.toHaveProperty('SortableTransactionRequiresTooManyScopeLocks')
      expect(errorExports).not.toHaveProperty('SortableScopeLockLimitExceeded')
      expect(errorExports).not.toHaveProperty('isRetryableSortableError')
      expect(errorExports).not.toHaveProperty('DatabaseDeadlock')
    })

    it('preserves a native deadlock as the top-level transaction error', async () => {
      const nativeDeadlock = Object.assign(new Error('deadlock detected'), {
        code: '40P01',
        detail: 'native driver detail',
      })

      const error = await captureError(async () => {
        await ApplicationModel.transaction(() => {
          throw nativeDeadlock
        })
      })

      expect(error).toBe(nativeDeadlock)
      expect(error).toMatchObject({ code: '40P01', detail: 'native driver detail' })
      expect(error).not.toHaveProperty('cause')
    })

    it('preserves the test-app MySQL native deadlock shape at the same seam', async () => {
      const nativeDeadlock = Object.assign(new Error('Deadlock found when trying to get lock'), {
        code: 'ER_LOCK_DEADLOCK',
        errno: 1213,
        sqlState: '40001',
      })

      const error = await captureError(async () => {
        await MysqlUser.transaction(() => {
          throw nativeDeadlock
        })
      })

      expect(error).toBe(nativeDeadlock)
      expect(error).toMatchObject({ code: 'ER_LOCK_DEADLOCK', errno: 1213, sqlState: '40001' })
      expect(error).not.toHaveProperty('cause')
    })
  })
})
