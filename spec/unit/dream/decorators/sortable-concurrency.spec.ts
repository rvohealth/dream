import { sql } from 'kysely'
import pg from 'pg'
import Dream from '../../../../src/Dream.js'
import DreamTransaction from '../../../../src/dream/DreamTransaction.js'
import { MAX_SORTABLE_BATCH_SCOPE_LOCKS } from '../../../../src/decorators/field/sortable/helpers/acquireStabilizedSortableBatchLocks.js'
import { sortableScopeLockKeyForCurrentScope } from '../../../../src/decorators/field/sortable/helpers/sortableScopeLockKeys.js'
import DreamApp from '../../../../src/dream-app/index.js'
import Query from '../../../../src/dream/Query.js'
import KyselyQueryDriver from '../../../../src/dream/QueryDriver/Kysely.js'
import PostgresQueryDriver from '../../../../src/dream/QueryDriver/Postgres.js'
import QueryDriverBase from '../../../../src/dream/QueryDriver/Base.js'
import SortableBatchRequiresTooManyScopeLocks from '../../../../src/errors/SortableBatchRequiresTooManyScopeLocks.js'
import SortableRequiresAdvisoryTransactionLocks from '../../../../src/errors/SortableRequiresAdvisoryTransactionLocks.js'
import SortableScopeLockWaitTimedOut from '../../../../src/errors/SortableScopeLockWaitTimedOut.js'
import testDb from '../../../helpers/testDb.js'
import MysqlQueryDriver from '../../../../test-app/app/conf/mysql/MysqlQueryDriver.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Balloon from '../../../../test-app/app/models/Balloon.js'
import Latex from '../../../../test-app/app/models/Balloon/Latex.js'
import CommitHookSortableModel from '../../../../test-app/app/models/CommitHookSortableModel.js'
import Post from '../../../../test-app/app/models/Post.js'
import TextScopedSortableModel from '../../../../test-app/app/models/TextScopedSortableModel.js'
import UnscopedSortableModel from '../../../../test-app/app/models/UnscopedSortableModel.js'
import User from '../../../../test-app/app/models/User.js'

// How long a blocked writer is given to prove it is genuinely blocked. These
// specs are deterministic by interposition — a competing writer is launched at a
// known point inside the holder's transaction — so this window only has to be
// long enough that a *non*-blocked writer would certainly have settled.
const BLOCKED_WRITER_GRACE_MS = 500

describe('@Sortable concurrency', () => {
  let user: User
  let user2: User

  beforeEach(async () => {
    user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
    user2 = await User.create({ email: 'chalupas@johnson', password: 'howyadoin' })
  })

  /**
   * Interposes on the scope-lock seam. `sabotage` runs once, immediately after
   * an acquisition statement has taken its whole key set and while the
   * acquiring transaction still holds it, so a competing writer launched there
   * must not be able to settle until that transaction commits. `nthCall` counts
   * acquisition statements, not keys: the seam takes every key of one pass in
   * one statement.
   */
  function interposeAfterScopeLockAcquired(sabotage: () => void | Promise<void>, { nthCall = 1 } = {}) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const original = PostgresQueryDriver.acquireAdvisoryTransactionLocks
    let calls = 0

    return vi
      .spyOn(PostgresQueryDriver, 'acquireAdvisoryTransactionLocks')
      .mockImplementation(async function (txn: DreamTransaction<any>, keys: bigint[]) {
        await original.call(PostgresQueryDriver, txn, keys)
        if (++calls === nthCall) await sabotage()
      })
  }

  context('the deferrable unique constraint the create path relies on', () => {
    // The create path deliberately acquires its scope lock *after* the INSERT,
    // which is only safe because the sortable tables' unique constraint is
    // DEFERRABLE INITIALLY DEFERRED: each transaction's check happens at its own
    // commit, by which time both rows carry their final positions. If this ever
    // stopped holding, the create path's design would have to change.
    it('tolerates two uncommitted rows at the same position in one scope', async () => {
      let secondInsertCompleted = false

      await UnscopedSortableModel.transaction(async txnA => {
        const modelA = await UnscopedSortableModel.txn(txnA).create({ position: 0 }, { skipHooks: true })

        await UnscopedSortableModel.transaction(async txnB => {
          // a second, independent transaction inserting the identical position
          // while transaction A's row is still uncommitted
          const modelB = await UnscopedSortableModel.txn(txnB).create({ position: 0 }, { skipHooks: true })
          secondInsertCompleted = true
          await modelB.txn(txnB).update({ position: 2 }, { skipHooks: true })
        })

        expect(secondInsertCompleted).toBe(true)
        await modelA.txn(txnA).update({ position: 1 }, { skipHooks: true })
      })

      expect((await UnscopedSortableModel.order('position').all()).map(model => model.position)).toEqual([
        1, 2,
      ])
    })
  })

  context('the advisory lock seam', () => {
    it('throws from the base driver, naming the method to implement', async () => {
      await expect(
        QueryDriverBase.acquireAdvisoryTransactionLocks(null as unknown as DreamTransaction<any>, [1n])
      ).rejects.toThrow('override acquireAdvisoryTransactionLocks in child class')
    })

    it('is not claimed by a driver that has not implemented it', () => {
      expect(MysqlQueryDriver.supportsAdvisoryTransactionLocks).toBe(false)
      expect(PostgresQueryDriver.supportsAdvisoryTransactionLocks).toBe(true)
    })

    context('on a driver without advisory transaction locks', () => {
      beforeEach(() => {
        PostgresQueryDriver.supportsAdvisoryTransactionLocks = false
      })

      afterEach(() => {
        PostgresQueryDriver.supportsAdvisoryTransactionLocks = true
      })

      it('fails loudly on a sortable create rather than silently racing', async () => {
        await expect(UnscopedSortableModel.create()).rejects.toThrow(SortableRequiresAdvisoryTransactionLocks)
        expect(await UnscopedSortableModel.count()).toEqual(0)
      })

      it('fails loudly on a sortable scope-changing update rather than silently racing', async () => {
        PostgresQueryDriver.supportsAdvisoryTransactionLocks = true
        const post = await Post.create({ body: 'hello', user })
        PostgresQueryDriver.supportsAdvisoryTransactionLocks = false

        await expect(post.update({ user: user2 })).rejects.toThrow(SortableRequiresAdvisoryTransactionLocks)
        expect((await Post.findOrFail(post.id)).userId).toEqual(user.id)
      })

      it('fails loudly on Dream.resort before reading the table, even when every sort scope is already contiguous', async () => {
        PostgresQueryDriver.supportsAdvisoryTransactionLocks = true
        await UnscopedSortableModel.create()
        await UnscopedSortableModel.create()
        PostgresQueryDriver.supportsAdvisoryTransactionLocks = false

        const candidateRead = vi.spyOn(Query.prototype, 'pluckEach')

        await expect(UnscopedSortableModel.resort('position')).rejects.toThrow(
          SortableRequiresAdvisoryTransactionLocks
        )
        expect(candidateRead).not.toHaveBeenCalled()
      })
    })
  })

  context('creating', () => {
    it('takes the scope lock before the first position read and before the position write', async () => {
      const callOrder: string[] = []

      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalLock = PostgresQueryDriver.acquireAdvisoryTransactionLocks
      vi.spyOn(PostgresQueryDriver, 'acquireAdvisoryTransactionLocks').mockImplementation(async function (
        txn: DreamTransaction<any>,
        keys: bigint[]
      ) {
        callOrder.push('lock')
        await originalLock.call(PostgresQueryDriver, txn, keys)
      })

      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalMax = KyselyQueryDriver.prototype.max
      vi.spyOn(KyselyQueryDriver.prototype, 'max').mockImplementation(async function (
        this: KyselyQueryDriver<UnscopedSortableModel>,
        columnName: string
      ) {
        callOrder.push('positionRead')
        return await originalMax.call(this, columnName)
      })

      // the position write has no driver seam of its own — it is the UPDATE
      // that puts the computed position on the row — so it is recognized as the
      // driver sends it
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalQuery = pg.Client.prototype.query
      vi.spyOn(pg.Client.prototype as any, 'query').mockImplementation(function (
        this: pg.Client,
        ...args: unknown[]
      ) {
        const sql = args[0]
        if (typeof sql === 'string' && /^update "unscoped_sortable_models" set "position" = \$1/.test(sql))
          callOrder.push('write')

        return (originalQuery as (...callArgs: unknown[]) => unknown).apply(this, args)
      } as any)

      await UnscopedSortableModel.create()

      expect(callOrder[0]).toEqual('lock')
      expect(callOrder).toContain('positionRead')
      expect(callOrder).toContain('write')
      expect(callOrder.indexOf('lock')).toBeLessThan(callOrder.indexOf('write'))
    })

    it('holds the scope lock until the create commits, blocking a concurrent create in the same scope', async () => {
      let competingCreateSettled = false
      const competingCreates: Promise<UnscopedSortableModel>[] = []

      interposeAfterScopeLockAcquired(async () => {
        competingCreates.push(
          UnscopedSortableModel.create().then(model => {
            competingCreateSettled = true
            return model
          })
        )

        await new Promise(resolve => setTimeout(resolve, BLOCKED_WRITER_GRACE_MS))
        expect(competingCreateSettled).toBe(false)
      })

      const first = await UnscopedSortableModel.create()
      const [second] = await Promise.all(competingCreates)

      expect(competingCreates).toHaveLength(1)
      expect([first.position, second!.position].sort()).toEqual([1, 2])
      expect((await UnscopedSortableModel.order('position').all()).map(model => model.position)).toEqual([
        1, 2,
      ])
    }, 15000)
  })

  context('a position/scope-changing update', () => {
    it('takes the scope lock in the same transaction as the driver UPDATE, before it', async () => {
      const post = await Post.create({ body: 'hello', user })
      const callOrder: string[] = []
      const lockTransactions: (DreamTransaction<any> | null)[] = []
      const writeTransactions: (DreamTransaction<any> | null)[] = []

      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalLock = PostgresQueryDriver.acquireAdvisoryTransactionLocks
      vi.spyOn(PostgresQueryDriver, 'acquireAdvisoryTransactionLocks').mockImplementation(async function (
        txn: DreamTransaction<any>,
        keys: bigint[]
      ) {
        callOrder.push('lock')
        lockTransactions.push(txn)
        await originalLock.call(PostgresQueryDriver, txn, keys)
      })

      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalSave = KyselyQueryDriver.saveDream
      vi.spyOn(KyselyQueryDriver, 'saveDream').mockImplementation(async function (
        dream: Dream,
        txn: DreamTransaction<any> | null = null
      ) {
        callOrder.push('write')
        writeTransactions.push(txn)
        return await originalSave.call(KyselyQueryDriver, dream, txn)
      })

      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalMax = KyselyQueryDriver.prototype.max
      vi.spyOn(KyselyQueryDriver.prototype, 'max').mockImplementation(async function (
        this: KyselyQueryDriver<Post>,
        columnName: string
      ) {
        callOrder.push('positionRead')
        return await originalMax.call(this, columnName)
      })

      await post.update({ user: user2 })

      expect(callOrder[0]).toEqual('lock')
      expect(callOrder).toContain('write')
      expect(callOrder).toContain('positionRead')
      expect(writeTransactions[0]).not.toBeNull()
      // the lock is taken in the very transaction the UPDATE runs in, not in an
      // implicit single-statement one, or it would protect nothing
      expect(lockTransactions[0]).toBe(writeTransactions[0])
    })

    it('never commits the position = 0 sentinel', async () => {
      const post = await Post.create({ body: 'hello', user })
      const positionsObservedFromOutsideTheTransaction: (number | null)[] = []

      // the position read happens inside the update's transaction, after the
      // UPDATE has written the sentinel. A reader on another connection must
      // still see the record's pre-update, committed state.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalMax = KyselyQueryDriver.prototype.max
      vi.spyOn(KyselyQueryDriver.prototype, 'max').mockImplementation(async function (
        this: KyselyQueryDriver<Post>,
        columnName: string
      ) {
        const observed = await Post.findOrFail(post.id)
        positionsObservedFromOutsideTheTransaction.push(observed.position)
        return await originalMax.call(this, columnName)
      })

      await post.update({ user: user2 })

      expect(positionsObservedFromOutsideTheTransaction.length).toBeGreaterThan(0)
      expect(positionsObservedFromOutsideTheTransaction).not.toContain(0)
      expect((await Post.findOrFail(post.id)).position).toEqual(1)
    })

    it('holds the scope lock until the update commits, blocking a concurrent move into the same scope', async () => {
      const postA = await Post.create({ body: 'A', user: user2 })
      const postB = await Post.create({ body: 'B', user: user2 })

      let competingUpdateSettled = false
      const competingUpdates: Promise<void>[] = []

      interposeAfterScopeLockAcquired(async () => {
        competingUpdates.push(
          postB.update({ user }).then(() => {
            competingUpdateSettled = true
          })
        )

        await new Promise(resolve => setTimeout(resolve, BLOCKED_WRITER_GRACE_MS))
        expect(competingUpdateSettled).toBe(false)
      })

      await postA.update({ user })
      await Promise.all(competingUpdates)

      expect(competingUpdates).toHaveLength(1)
      expect(
        (await Post.where({ userId: user.id }).order('position').all()).map(post => post.position)
      ).toEqual([1, 2])
      expect(await Post.where({ userId: user2.id }).count()).toEqual(0)
    }, 15000)

    // The lock is what serializes two position changes in one scope. Where they
    // *land* additionally depends on each writer reading its position from the
    // database rather than from memory: the second writer here holds an instance
    // loaded before the first update, so a writer that trusted its in-memory
    // position would shift the wrong range and collide.
    it('holds the scope lock across concurrent position changes within one scope, which land contiguously', async () => {
      const postA = await Post.create({ body: 'A', user })
      const postB = await Post.create({ body: 'B', user })
      await Post.create({ body: 'C', user })

      let competingUpdateSettled = false
      const competingUpdates: Promise<PromiseSettledResult<void>>[] = []

      interposeAfterScopeLockAcquired(async () => {
        competingUpdates.push(
          Promise.allSettled([postB.update({ position: 1 })])
            .then(([settlement]) => settlement)
            .finally(() => {
              competingUpdateSettled = true
            })
        )

        await new Promise(resolve => setTimeout(resolve, BLOCKED_WRITER_GRACE_MS))
        expect(competingUpdateSettled).toBe(false)
      })

      await postA.update({ position: 3 })
      const [settlement] = await Promise.all(competingUpdates)

      expect(competingUpdates).toHaveLength(1)
      expect(competingUpdateSettled).toBe(true)
      expect(settlement!.status).toEqual('fulfilled')
      expect(
        (await Post.where({ userId: user.id }).order('position').all()).map(post => post.position)
      ).toEqual([1, 2, 3])
    }, 15000)
  })

  context('a position-changing update whose row is gone before the write', () => {
    it('shifts no sibling, since the vacancy it remembers was closed by whoever removed the row', async () => {
      const first = await Post.create({ body: 'first', user })
      const second = await Post.create({ body: 'second', user })
      const third = await Post.create({ body: 'third', user })

      // another connection removes the row entirely, leaving this instance
      // remembering a position the scope no longer has
      await sql`delete from posts where id = ${second.id}`.execute(testDb('default', 'primary'))

      // stands in for a sortable model declaring no updatedAt column: without
      // one, a position-only update has no other attribute to write, so the
      // driver write — whose own "no row" throw would otherwise end the save
      // before any position work — is skipped
      vi.spyOn(second as any, 'columns').mockReturnValue(
        new Set([...second.columns()].filter(column => column !== 'updatedAt'))
      )

      await ApplicationModel.transaction(async txn => {
        // the caller's own transaction, so a shift this update makes commits
        // even though the save's trailing reload of the vanished row throws
        await second
          .txn(txn)
          .update({ position: 1 })
          .catch(() => undefined)
      })

      expect((await Post.findOrFail(first.id)).position).toEqual(1)
      expect((await Post.findOrFail(third.id)).position).toEqual(3)
    })
  })

  context('operation-level lock acquisition on a multi-sortable-field model', () => {
    /**
     * The advisory keys hash the runtime scope values, so which of Balloon's
     * two sortable fields' keys sorts first varies with the user id. The
     * ordering assertions below are only sharp when sorted order and
     * declaration order disagree, so pick a user for whom they do. FNV-1a
     * inverts the order for roughly every other id, so 40 attempts failing is
     * one-in-a-trillion territory.
     */
    async function userWithInvertedKeyOrder(): Promise<{ scopeUser: User; sortedKeys: bigint[] }> {
      for (let attempt = 0; attempt < 40; attempt++) {
        const candidate = await User.create({
          email: `keyorder-${attempt}@keyorder`,
          password: 'howyadoin',
        })
        const probe = Latex.new({ userId: candidate.id } as any)
        const alphaKey = sortableScopeLockKeyForCurrentScope(probe, 'positionAlpha', ['user'])
        const betaKey = sortableScopeLockKeyForCurrentScope(probe, 'positionBeta', ['user'])
        if (alphaKey > betaKey) return { scopeUser: candidate, sortedKeys: [betaKey, alphaKey] }
      }
      throw new Error('found no user whose sorted key order inverts declaration order')
    }

    function recordAcquiredKeys(): bigint[] {
      const acquired: bigint[] = []
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const original = PostgresQueryDriver.acquireAdvisoryTransactionLocks

      vi.spyOn(PostgresQueryDriver, 'acquireAdvisoryTransactionLocks').mockImplementation(async function (
        txn: DreamTransaction<any>,
        keys: bigint[]
      ) {
        acquired.push(...keys)
        await original.call(PostgresQueryDriver, txn, keys)
      })

      return acquired
    }

    function firstAcquisitions(keys: bigint[]): bigint[] {
      return [...new Set(keys)]
    }

    it('acquires the identical sorted key sequence on create, destroy, position-changing update and undestroy', async () => {
      const { scopeUser, sortedKeys } = await userWithInvertedKeyOrder()
      const keys = recordAcquiredKeys()

      const balloon = await Latex.create({ user: scopeUser })
      const createOrder = firstAcquisitions(keys)

      keys.length = 0
      await Latex.create({ user: scopeUser })

      keys.length = 0
      await balloon.update({ positionAlpha: 2, positionBeta: 2 })
      const updateOrder = firstAcquisitions(keys)

      keys.length = 0
      await balloon.destroy()
      const destroyOrder = firstAcquisitions(keys)

      keys.length = 0
      await balloon.undestroy()
      const undestroyOrder = firstAcquisitions(keys)

      // every path takes its first acquisition of each key in the one global
      // order — ascending — so no two operations can deadlock on their initial
      // key sets
      expect(createOrder).toEqual(sortedKeys)
      expect(updateOrder).toEqual(sortedKeys)
      expect(destroyOrder).toEqual(sortedKeys)
      expect(undestroyOrder).toEqual(sortedKeys)
    })

    it('issues one snapshot SELECT covering every sortable field on destroy, not one per field', async () => {
      const balloon = await Latex.create({ user })
      await Latex.create({ user })

      const snapshotSelects: string[] = []
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalQuery = pg.Client.prototype.query

      vi.spyOn(pg.Client.prototype as any, 'query').mockImplementation(function (
        this: pg.Client,
        ...args: unknown[]
      ) {
        const sql = args[0]
        if (
          typeof sql === 'string' &&
          /^select "position_alpha", "user_id", "position_beta" from "beautiful_balloons"/.test(sql)
        ) {
          snapshotSelects.push(sql)
        }
        return (originalQuery as (...callArgs: unknown[]) => unknown).apply(this, args)
      } as any)

      await balloon.destroy()

      expect(snapshotSelects).toHaveLength(1)
    })

    it('holds every sortable field’s scope key until the destroy commits, blocking a concurrent create in the same scope', async () => {
      const balloon = await Latex.create({ user })
      await Latex.create({ user })

      let competingCreateSettled = false
      const competingCreates: Promise<Latex>[] = []

      // the destroy phase acquires both fields' keys in one sorted pass — one
      // statement over the whole key set — so the sabotage's first call already
      // runs with both held
      interposeAfterScopeLockAcquired(async () => {
        competingCreates.push(
          Latex.create({ user }).then(model => {
            competingCreateSettled = true
            return model
          })
        )

        await new Promise(resolve => setTimeout(resolve, BLOCKED_WRITER_GRACE_MS))
        expect(competingCreateSettled).toBe(false)
      })

      await balloon.destroy()
      await Promise.all(competingCreates)

      expect(competingCreates).toHaveLength(1)
      expect(competingCreateSettled).toBe(true)

      // the survivor compacted into the vacated slot and the new create landed
      // after it, in both position spaces
      const remaining = await Balloon.where({ userId: user.id }).order('positionAlpha').all()
      expect(remaining.map(each => each.positionAlpha)).toEqual([1, 2])
      expect(remaining.map(each => each.positionBeta).sort()).toEqual([1, 2])
    }, 15000)
  })

  context('user after-hooks on a self-opened sortable save', () => {
    // a position-changing update, because that is the path whose scope lock is
    // acquired before the driver write: every after-hook of that save runs
    // after the lock was taken, so this is the sharpest window to pin
    it('releases the scope lock at COMMIT, so a concurrent create in the same scope completes while a slow afterSave hook is still running', async () => {
      const model = await CommitHookSortableModel.create()
      await UnscopedSortableModel.create()

      let concurrentCreateCompletedDuringHook = false

      vi.spyOn(CommitHookSortableModel.prototype, 'runsAfterSave').mockImplementationOnce(async () => {
        // if the scope lock were still held here, this same-scope create would
        // block on it while the save waited for this hook to return — a hang
        // with no way out. UnscopedSortableModel shares this model's table and
        // scope, so it contends on the same lock key without invoking this
        // model's hooks.
        await UnscopedSortableModel.create()
        concurrentCreateCompletedDuringHook = true
      })

      await model.update({ position: 2 })

      expect(concurrentCreateCompletedDuringHook).toBe(true)
      expect((await UnscopedSortableModel.order('position').all()).map(record => record.position)).toEqual([
        1, 2, 3,
      ])
      expect((await UnscopedSortableModel.findOrFail(model.id)).position).toEqual(2)
    }, 15000)

    it('does not make a concurrent create in the same scope wait for a slow afterSaveCommit hook', async () => {
      let competingCreateSettled = false
      const competingCreates: Promise<UnscopedSortableModel>[] = []

      vi.spyOn(CommitHookSortableModel.prototype, 'runsAfterSaveCommit').mockImplementationOnce(async () => {
        competingCreates.push(
          UnscopedSortableModel.create().then(model => {
            competingCreateSettled = true
            return model
          })
        )

        await new Promise(resolve => setTimeout(resolve, BLOCKED_WRITER_GRACE_MS))
        expect(competingCreateSettled).toBe(true)
      })

      await CommitHookSortableModel.create()
      await Promise.all(competingCreates)

      expect(competingCreates).toHaveLength(1)
      expect(competingCreateSettled).toBe(true)
    }, 15000)

    it('invokes the *Commit hook families with no transaction — never a committed one', async () => {
      CommitHookSortableModel.receivedHookCalls = []

      const model = await CommitHookSortableModel.create()
      await UnscopedSortableModel.create()
      await model.update({ position: 2 })

      const commitHookCalls = CommitHookSortableModel.receivedHookCalls.filter(call =>
        /Commit$/.test(call.hook)
      )
      expect(commitHookCalls.map(call => call.hook)).toEqual([
        'afterCreateCommit',
        'afterSaveCommit',
        'afterUpdateCommit',
        'afterSaveCommit',
      ])
      commitHookCalls.forEach(call => expect(call.txn ?? null).toBeNull())
    })

    it('leaves the created row committed when an afterCreate hook throws', async () => {
      vi.spyOn(CommitHookSortableModel.prototype, 'runsAfterCreate').mockImplementationOnce(() => {
        throw new Error('afterCreate boom')
      })

      await expect(CommitHookSortableModel.create()).rejects.toThrow('afterCreate boom')

      const models = await UnscopedSortableModel.all()
      expect(models).toHaveLength(1)
      expect(models[0]!.position).toEqual(1)
    })

    it('leaves the written position committed when an afterUpdate hook throws', async () => {
      const model = await CommitHookSortableModel.create()
      await UnscopedSortableModel.create()

      vi.spyOn(CommitHookSortableModel.prototype, 'runsAfterUpdate').mockImplementationOnce(() => {
        throw new Error('afterUpdate boom')
      })

      await expect(model.update({ position: 2 })).rejects.toThrow('afterUpdate boom')

      expect((await UnscopedSortableModel.order('position').all()).map(record => record.position)).toEqual([
        1, 2,
      ])
      expect((await UnscopedSortableModel.findOrFail(model.id)).position).toEqual(2)
    })

    it('registers no sortable position work in the shared after-hook lists', () => {
      const hooks = UnscopedSortableModel['hooks']

      expect(hooks.afterCreate).toHaveLength(0)
      expect(hooks.afterCreateCommit).toHaveLength(0)
      expect(hooks.afterUpdate).toHaveLength(0)
      expect(hooks.afterUpdateCommit).toHaveLength(0)
      expect(hooks.afterDestroyCommit).toHaveLength(0)
      // destroy's lock acquisition and snapshot read run as a phase in
      // destroyDream, not as beforeDestroy hooks; only the per-field
      // compaction remains registered, after the delete
      expect(hooks.beforeDestroy).toHaveLength(0)
      expect(hooks.afterDestroy.map(hook => hook.method)).toEqual([
        '_setValuesAfterDestructionForPositionAfterDestroy',
      ])
    })
  })

  context('an ordinary update to a sortable model', () => {
    it('changes neither position nor scope, so it opens no transaction', async () => {
      const post = await Post.create({ body: 'hello', user })
      const transactionSpy = vi.spyOn(KyselyQueryDriver, 'transaction')

      await post.update({ body: 'goodbye' })

      // no transaction means the commit hooks still run inline, exactly as they
      // did before sortable saves became transactional
      expect(transactionSpy).not.toHaveBeenCalled()
      expect((await Post.findOrFail(post.id)).position).toEqual(1)
    })

    it('opens one when the save does change the position', async () => {
      const post = await Post.create({ body: 'hello', user })
      await Post.create({ body: 'hello2', user })
      const transactionSpy = vi.spyOn(KyselyQueryDriver, 'transaction')

      await post.update({ position: 2 })

      expect(transactionSpy).toHaveBeenCalled()
      expect((await Post.findOrFail(post.id)).position).toEqual(2)
    })
  })

  context('the bounded wait on a scope lock', () => {
    // Short enough that a spec proving the bound fires does not spend the
    // default 5 seconds waiting for it, and long enough that no uncontended
    // acquisition anywhere in this suite could reach it.
    const TEST_LOCK_TIMEOUT_MS = 750
    // Well past the bound above: a run that reaches this was not bounded at all.
    const HANG_DETECTION_MS = 5000

    let priorLockTimeout: number

    beforeEach(() => {
      priorLockTimeout = DreamApp.getOrFail().sortableScopeLockTimeout
      DreamApp.getOrFail().set('sortableScopeLockTimeout', TEST_LOCK_TIMEOUT_MS)
    })

    afterEach(() => {
      DreamApp.getOrFail().set('sortableScopeLockTimeout', priorLockTimeout)
    })

    it('gives up with a typed error rather than hanging when a sortable destroy runs outside its enclosing transaction', async () => {
      const post = await Post.create({ body: 'first', user })

      const outcome = await Promise.race([
        ApplicationModel.transaction(async txn => {
          // takes this user's sort scope key, and holds it until this callback
          // returns
          await Post.txn(txn).create({ body: 'inside', user })

          // no `.txn(txn)`: this opens a transaction of its own, on another
          // connection, and waits for a key the transaction it is written
          // inside of cannot release until this call returns. Nothing is
          // deadlocked in the database's sense — only one side is waiting — so
          // an unbounded wait here wedges the connection permanently
          await post.destroy()
        }).then(() => 'completed' as const),

        new Promise<'hung'>(resolve => setTimeout(() => resolve('hung'), HANG_DETECTION_MS)),
      ]).catch((error: unknown) => error)

      expect(outcome).toBeInstanceOf(SortableScopeLockWaitTimedOut)
    }, 20000)

    it('is Postgres 55P03 underneath, and reaches the caller translated', async () => {
      // a key nothing else derives, so the only contention is this spec's
      const lockKey = 918_273_645n
      let rawErrorCode: string | undefined
      let translatedError: unknown

      await ApplicationModel.transaction(async holder => {
        await PostgresQueryDriver.acquireAdvisoryTransactionLocks(holder, [lockKey])

        // what Postgres itself does to an advisory wait under a lock_timeout —
        // asserted against Postgres rather than against Dream's reading of it
        await ApplicationModel.transaction(async waiter => {
          await sql`select set_config('lock_timeout', '250', true)`.execute(waiter.kyselyTransaction)
          await sql`select pg_advisory_xact_lock(${lockKey.toString()}::bigint)`.execute(
            waiter.kyselyTransaction
          )
        }).catch((error: unknown) => {
          rawErrorCode = (error as { code?: string }).code
        })

        // and what the same wait looks like coming back through the seam
        await ApplicationModel.transaction(async waiter => {
          await PostgresQueryDriver.acquireAdvisoryTransactionLocks(waiter, [lockKey])
        }).catch((error: unknown) => {
          translatedError = error
        })
      })

      expect(rawErrorCode).toEqual('55P03')
      expect(translatedError).toBeInstanceOf(SortableScopeLockWaitTimedOut)
      expect((translatedError as SortableScopeLockWaitTimedOut).timeoutMs).toEqual(TEST_LOCK_TIMEOUT_MS)
    }, 20000)

    it('bounds the acquisition alone, restoring the lock_timeout the transaction was already running under', async () => {
      await ApplicationModel.transaction(async txn => {
        await sql`select set_config('lock_timeout', '7654', true)`.execute(txn.kyselyTransaction)

        await PostgresQueryDriver.acquireAdvisoryTransactionLocks(txn, [112_233n])

        const result = await sql<{ value: string }>`select current_setting('lock_timeout') as value`.execute(
          txn.kyselyTransaction
        )
        // the application's own bound, not Dream's: the row locks this
        // transaction goes on to take wait exactly as it configured them to
        expect(result.rows[0]!.value).toEqual('7654ms')
      })

      // and where the application set none, none is left behind
      await ApplicationModel.transaction(async txn => {
        await PostgresQueryDriver.acquireAdvisoryTransactionLocks(txn, [445_566n])

        const result = await sql<{ value: string }>`select current_setting('lock_timeout') as value`.execute(
          txn.kyselyTransaction
        )
        expect(result.rows[0]!.value).toEqual('0')
      })
    })

    it('leaves a create that timed out retryable, rather than persisted with no row', async () => {
      const doomed = Post.new({ body: 'doomed', user })

      await ApplicationModel.transaction(async txn => {
        // takes this user's sort scope key and holds it for the rest of this
        // callback, so the save below — on its own connection — waits for it
        await Post.txn(txn).create({ body: 'holder', user })

        await expect(doomed.save()).rejects.toBeInstanceOf(SortableScopeLockWaitTimedOut)
      })

      // the save opened the transaction, so its rollback took the INSERT with
      // it: an instance still claiming the id of that row would be a record
      // whose row does not exist, and one left clean would make the retry a
      // silent no-op
      expect(doomed.isNewRecord).toBe(true)
      expect(doomed.id).toBeUndefined()

      await doomed.save()

      expect(doomed.id).not.toBeUndefined()
      expect((await Post.findOrFail(doomed.id)).body).toEqual('doomed')
      expect((await Post.where({ userId: user.id }).order('position').all()).map(post => post.body)).toEqual([
        'holder',
        'doomed',
      ])
    }, 20000)

    it('leaves an update that timed out retryable, with its requested move still pending', async () => {
      const post = await Post.create({ body: 'first', user })
      await Post.create({ body: 'second', user })

      await ApplicationModel.transaction(async txn => {
        await Post.txn(txn).create({ body: 'holder', user })

        await expect(post.update({ position: 2 })).rejects.toBeInstanceOf(SortableScopeLockWaitTimedOut)
      })

      // the position sentinel the save applied went back with the rollback,
      // leaving the requested move where the caller put it and the instance
      // dirty — an instance the save had left clean would make the retry
      // return without writing anything
      expect(post.position).toEqual(2)
      expect(post.isDirty).toBe(true)
      expect((await Post.findOrFail(post.id)).position).toEqual(1)

      await post.save()

      expect(post.position).toEqual(2)
      expect((await Post.where({ userId: user.id }).order('position').all()).map(post => post.body)).toEqual([
        'second',
        'first',
        'holder',
      ])
    }, 20000)

    it('waits without bound when the timeout is configured to 0', async () => {
      DreamApp.getOrFail().set('sortableScopeLockTimeout', 0)
      let competingCreateSettled = false
      const competingCreates: Promise<UnscopedSortableModel>[] = []

      interposeAfterScopeLockAcquired(async () => {
        competingCreates.push(
          UnscopedSortableModel.create().then(model => {
            competingCreateSettled = true
            return model
          })
        )

        // longer than the bound this context configures, which would have
        // cancelled the competing create had it still been in force
        await new Promise(resolve => setTimeout(resolve, TEST_LOCK_TIMEOUT_MS * 2))
        expect(competingCreateSettled).toBe(false)
      })

      const first = await UnscopedSortableModel.create()
      const [second] = await Promise.all(competingCreates)

      expect([first.position, second!.position].sort()).toEqual([1, 2])
    }, 20000)

    it('waits without bound at 0 even on a connection carrying a lock_timeout of its own', async () => {
      DreamApp.getOrFail().set('sortableScopeLockTimeout', 0)
      // a key nothing else derives, so the only contention is this spec's
      const lockKey = 918_273_647n
      let waiterOutcome: unknown = 'pending'
      let waiter: Promise<void> | undefined

      await ApplicationModel.transaction(async holder => {
        await PostgresQueryDriver.acquireAdvisoryTransactionLocks(holder, [lockKey])

        waiter = ApplicationModel.transaction(async txn => {
          // the application's own bound, far shorter than this holder's
          // transaction: an acquisition asked to wait without bound must not
          // be cancelled by it
          await sql`select set_config('lock_timeout', '250', true)`.execute(txn.kyselyTransaction)
          await PostgresQueryDriver.acquireAdvisoryTransactionLocks(txn, [lockKey])
        }).then(
          () => {
            waiterOutcome = 'acquired'
          },
          (error: unknown) => {
            waiterOutcome = error
          }
        )

        await new Promise(resolve => setTimeout(resolve, BLOCKED_WRITER_GRACE_MS))
        expect(waiterOutcome).toEqual('pending')
      })

      await waiter
      expect(waiterOutcome).toEqual('acquired')
    }, 20000)
  })

  context('with no sortableScopeLockTimeout configured', () => {
    it('bounds the wait at five seconds', () => {
      expect(DreamApp.getOrFail().sortableScopeLockTimeout).toEqual(5000)
    })

    it('applies that bound to every scope-lock acquisition it sends', async () => {
      const boundsApplied: unknown[][] = []

      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalQuery = pg.Client.prototype.query
      vi.spyOn(pg.Client.prototype as any, 'query').mockImplementation(function (
        this: pg.Client,
        ...args: unknown[]
      ) {
        const text = args[0]
        if (typeof text === 'string' && /pg_advisory_xact_lock/.test(text)) {
          expect(text).toContain("set_config('lock_timeout'")
          boundsApplied.push(args[1] as unknown[])
        }

        return (originalQuery as (...callArgs: unknown[]) => unknown).apply(this, args)
      } as any)

      await UnscopedSortableModel.create()

      expect(boundsApplied.length).toBeGreaterThan(0)
      boundsApplied.forEach(parameters => expect(parameters).toContain('5000'))
    })
  })

  context('the number of scope locks one batch may take', () => {
    it('refuses a locked batch spanning more sort scopes than the bound, before it locks or claims anything', async () => {
      // one row per sort scope, inserted in one statement: going through the
      // model would take a lock and compute a position for every one of them
      await sql`
        insert into text_scoped_sortable_models (scope_a, scope_b, position, created_at, updated_at)
        select 'scope-' || i, 'b', 1, now(), now()
        from generate_series(1, ${MAX_SORTABLE_BATCH_SCOPE_LOCKS + 1}::int) as i
      `.execute(testDb('default', 'primary'))

      const acquisitions = vi.spyOn(PostgresQueryDriver, 'acquireAdvisoryTransactionLocks')

      await expect(
        TextScopedSortableModel.query().destroy({
          lock: true,
          batchSize: MAX_SORTABLE_BATCH_SCOPE_LOCKS + 100,
        })
      ).rejects.toThrow(SortableBatchRequiresTooManyScopeLocks)

      expect(acquisitions).not.toHaveBeenCalled()
      expect(await TextScopedSortableModel.count()).toEqual(MAX_SORTABLE_BATCH_SCOPE_LOCKS + 1)
    }, 20000)

    it('allows a batch narrow enough to stay inside it', async () => {
      await sql`
        insert into text_scoped_sortable_models (scope_a, scope_b, position, created_at, updated_at)
        select 'scope-' || i, 'b', 1, now(), now()
        from generate_series(1, ${MAX_SORTABLE_BATCH_SCOPE_LOCKS + 1}::int) as i
      `.execute(testDb('default', 'primary'))

      const destroyed = await TextScopedSortableModel.query().destroy({
        lock: true,
        batchSize: MAX_SORTABLE_BATCH_SCOPE_LOCKS,
      })

      expect(destroyed).toEqual(MAX_SORTABLE_BATCH_SCOPE_LOCKS + 1)
      expect(await TextScopedSortableModel.count()).toEqual(0)
    }, 60000)
  })
})
