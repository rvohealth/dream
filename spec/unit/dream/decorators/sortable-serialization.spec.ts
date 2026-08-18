import { ExpressionBuilder } from 'kysely'
import pg from 'pg'
import { MAX_SCOPE_STABILIZATION_ROUNDS } from '../../../../src/decorators/field/sortable/helpers/stabilizeSortableScopeLocks.js'
import sortableScopeLockKey from '../../../../src/decorators/field/sortable/helpers/sortableScopeLockKey.js'
import DreamApp from '../../../../src/dream-app/index.js'
import DreamTransaction from '../../../../src/dream/DreamTransaction.js'
import Query from '../../../../src/dream/Query.js'
import KyselyQueryDriver from '../../../../src/dream/QueryDriver/Kysely.js'
import PostgresQueryDriver from '../../../../src/dream/QueryDriver/Postgres.js'
import SortableScopeDidNotStabilize from '../../../../src/errors/SortableScopeDidNotStabilize.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Balloon from '../../../../test-app/app/models/Balloon.js'
import Latex from '../../../../test-app/app/models/Balloon/Latex.js'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import Post from '../../../../test-app/app/models/Post.js'
import TextScopedSortableModel from '../../../../test-app/app/models/TextScopedSortableModel.js'
import User from '../../../../test-app/app/models/User.js'

// How long a blocked writer is given to prove it is genuinely blocked. These
// specs are deterministic by interposition — a competing writer is launched at a
// known point inside the holder's transaction — so this window only has to be
// long enough that a *non*-blocked writer would certainly have settled.
const BLOCKED_WRITER_GRACE_MS = 500

describe('@Sortable serialization across every position-mutating path', () => {
  let user: User
  let user2: User

  beforeEach(async () => {
    user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
    user2 = await User.create({ email: 'chalupas@johnson', password: 'howyadoin' })
  })

  /**
   * Records every advisory key the seam is asked for, in acquisition order,
   * while still taking the real lock.
   */
  function recordScopeLockKeys(): bigint[] {
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

  /**
   * `sabotage` runs once, immediately after the nth lock acquisition statement
   * and while the acquiring transaction still holds its keys. A statement
   * carries one pass's whole key set.
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

  /**
   * `sabotage` runs once, immediately *before* the nth lock acquisition
   * statement — the window a concurrent writer uses to disturb a set the
   * acquirer has already read but not yet locked.
   */
  function interposeBeforeScopeLockAcquired(sabotage: () => void | Promise<void>, { nthCall = 1 } = {}) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const original = PostgresQueryDriver.acquireAdvisoryTransactionLocks
    let calls = 0

    return vi
      .spyOn(PostgresQueryDriver, 'acquireAdvisoryTransactionLocks')
      .mockImplementation(async function (txn: DreamTransaction<any>, keys: bigint[]) {
        if (++calls === nthCall) await sabotage()
        await original.call(PostgresQueryDriver, txn, keys)
      })
  }

  /**
   * The key set of every advisory acquisition *statement*, in order, while
   * still taking the real locks. One entry is one round trip.
   */
  function recordScopeLockStatements(): bigint[][] {
    const statements: bigint[][] = []
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const original = PostgresQueryDriver.acquireAdvisoryTransactionLocks

    vi.spyOn(PostgresQueryDriver, 'acquireAdvisoryTransactionLocks').mockImplementation(async function (
      txn: DreamTransaction<any>,
      keys: bigint[]
    ) {
      statements.push([...keys])
      await original.call(PostgresQueryDriver, txn, keys)
    })

    return statements
  }

  function postScopeKey(post: Post, userId: string | null): bigint {
    return sortableScopeLockKey(post, 'position', [['userId', userId]])
  }

  context('the seam-call matrix — every position-mutating path takes the scope lock', () => {
    it('create', async () => {
      const keys = recordScopeLockKeys()
      const post = await Post.create({ body: 'hello', user })

      expect(keys).toContain(postScopeKey(post, user.id))
    })

    it('destroy', async () => {
      const post = await Post.create({ body: 'hello', user })
      const keys = recordScopeLockKeys()

      await post.destroy()

      expect(keys).toContain(postScopeKey(post, user.id))
    })

    it('a position-changing update', async () => {
      const post = await Post.create({ body: 'hello', user })
      await Post.create({ body: 'second', user })
      const keys = recordScopeLockKeys()

      await post.update({ position: 2 })

      expect(keys).toContain(postScopeKey(post, user.id))
    })

    it('a scope-changing update takes both the old-scope and the new-scope key', async () => {
      const post = await Post.create({ body: 'hello', user })
      const keys = recordScopeLockKeys()

      await post.update({ user: user2 })

      expect(keys).toContain(postScopeKey(post, user.id))
      expect(keys).toContain(postScopeKey(post, user2.id))
    })

    it('undestroy', async () => {
      const post = await Post.create({ body: 'hello', user })
      await post.destroy()
      const keys = recordScopeLockKeys()

      await post.undestroy()

      expect(keys).toContain(postScopeKey(post, user.id))
    })

    it('Dream.resort', async () => {
      const post = await Post.create({ body: 'hello', user })
      await Post.create({ body: 'second', user })
      await Post.where({ id: post.id }).update({ position: 9 }, { skipHooks: true })

      const keys = recordScopeLockKeys()
      await Post.resort('position')

      expect(keys).toContain(postScopeKey(post, user.id))
    })
  })

  context('the exclusion the lock provides', () => {
    it('a destroy holds the scope lock until it commits, blocking a concurrent create in the same scope', async () => {
      await Post.create({ body: 'A', user })
      const postB = await Post.create({ body: 'B', user })
      await Post.create({ body: 'C', user })

      let competingCreateSettled = false
      const competingCreates: Promise<Post>[] = []

      interposeAfterScopeLockAcquired(async () => {
        competingCreates.push(
          Post.create({ body: 'D', user }).then(post => {
            competingCreateSettled = true
            return post
          })
        )

        await new Promise(resolve => setTimeout(resolve, BLOCKED_WRITER_GRACE_MS))
        expect(competingCreateSettled).toBe(false)
      })

      await postB.destroy()
      await Promise.all(competingCreates)

      expect(competingCreates).toHaveLength(1)
      expect(
        (await Post.where({ userId: user.id }).order('position').all()).map(post => post.position)
      ).toEqual([1, 2, 3])
    }, 15000)
  })

  context('key derivation', () => {
    it('is identical across every path that touches one sort scope', async () => {
      const createKeys = recordScopeLockKeys()
      const post = await Post.create({ body: 'hello', user })
      vi.restoreAllMocks()

      await Post.create({ body: 'second', user })

      const updateKeys = recordScopeLockKeys()
      await post.update({ position: 2 })
      vi.restoreAllMocks()

      const destroyKeys = recordScopeLockKeys()
      await post.destroy()
      vi.restoreAllMocks()

      const undestroyKeys = recordScopeLockKeys()
      await post.undestroy()

      const expected = postScopeKey(post, user.id)
      expect(createKeys).toContain(expected)
      expect(updateKeys).toContain(expected)
      expect(destroyKeys).toContain(expected)
      expect(undestroyKeys).toContain(expected)
    })

    it('differs across databases, since Postgres advisory locks are cluster-wide', async () => {
      const post = await Post.create({ body: 'hello', user })
      const realKey = postScopeKey(post, user.id)

      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalDbName = DreamApp.prototype.dbName
      vi.spyOn(DreamApp.prototype, 'dbName').mockImplementation(function (
        this: DreamApp,
        connectionName: any,
        role: any
      ) {
        return `${originalDbName.call(this, connectionName, role)}_somewhere_else`
      })

      expect(postScopeKey(post, user.id)).not.toEqual(realKey)
    })
  })

  context('the batched, row-locking query APIs', () => {
    it('acquires every scope key before claiming a row, on destroy({ lock: true })', async () => {
      await Post.create({ body: 'A', user })
      await Post.create({ body: 'B', user })
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
      const originalTakeAll = KyselyQueryDriver.prototype.takeAll
      vi.spyOn(KyselyQueryDriver.prototype, 'takeAll').mockImplementation(async function (
        this: KyselyQueryDriver<Post>,
        options: any = {}
      ) {
        if (options.lock) callOrder.push('claim')
        return await originalTakeAll.call(this, options)
      })

      expect(await Post.where({ userId: user.id }).destroy({ lock: true })).toEqual(2)

      expect(callOrder[0]).toEqual('lock')
      expect(callOrder.indexOf('lock')).toBeLessThan(callOrder.indexOf('claim'))
    })

    it('acquires every scope key before claiming a row, on the attribute form of update({ lock: true })', async () => {
      await Post.create({ body: 'A', user })
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
      const originalTakeAll = KyselyQueryDriver.prototype.takeAll
      vi.spyOn(KyselyQueryDriver.prototype, 'takeAll').mockImplementation(async function (
        this: KyselyQueryDriver<Post>,
        options: any = {}
      ) {
        if (options.lock) callOrder.push('claim')
        return await originalTakeAll.call(this, options)
      })

      expect(await Post.where({ userId: user.id }).update({ userId: user2.id }, { lock: true })).toEqual(1)

      expect(callOrder[0]).toEqual('lock')
      expect(callOrder.indexOf('lock')).toBeLessThan(callOrder.indexOf('claim'))
      expect((await Post.where({ userId: user2.id }).all()).map(post => post.position)).toEqual([1])
    })

    it('preflights the destination scope key when the batch names the BelongsTo association', async () => {
      const post = await Post.create({ body: 'A', user })
      const statements = recordScopeLockStatements()

      expect(await Post.where({ id: post.id }).update({ user: user2 }, { lock: true })).toEqual(1)

      // the destination scope is named by the association rather than by the
      // foreign key backing it, and the preflight — the first acquisition
      // statement, taken before any row is claimed — has to carry its key.
      // Asserting only that the key is taken eventually is no assertion at all:
      // the per-record save takes it later on any account
      expect(statements[0]).toContain(postScopeKey(post, user2.id))
      expect(statements[0]).toContain(postScopeKey(post, user.id))
    })

    it('takes an operation-wide, sorted key set when one batch spans two scopes', async () => {
      const postA = await Post.create({ body: 'A', user })
      const postB = await Post.create({ body: 'B', user: user2 })
      const keys = recordScopeLockKeys()

      expect(await Post.where({ id: [postA.id, postB.id] }).destroy({ lock: true })).toEqual(2)

      const preflightKeys = keys.slice(0, 2)
      expect(new Set(preflightKeys)).toEqual(
        new Set([postScopeKey(postA, user.id), postScopeKey(postB, user2.id)])
      )
      // sorted, which is what makes two callers over the same pair of scopes
      // unable to deadlock against each other
      expect(preflightKeys[0]! < preflightKeys[1]!).toBe(true)
    })

    context('when a competing writer keeps moving the candidates between scopes', () => {
      /**
       * Moves the batch's candidate row into a scope nobody has locked yet,
       * immediately after each of the first `movingTargets.length` advisory
       * acquisition statements — the window between the preflight's unlocked
       * read and the locks it takes on what that read implied.
       */
      function moveCandidateAfterEachAcquisition(post: Post, movingTargets: User[]) {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const originalLock = PostgresQueryDriver.acquireAdvisoryTransactionLocks
        let moves = 0

        vi.spyOn(PostgresQueryDriver, 'acquireAdvisoryTransactionLocks').mockImplementation(async function (
          txn: DreamTransaction<any>,
          keys: bigint[]
        ) {
          await originalLock.call(PostgresQueryDriver, txn, keys)

          const target = movingTargets[moves++]
          if (target) {
            const mover = await Post.findOrFail(post.id)
            await mover.update({ user: target, position: 1 }, { skipHooks: true })
          }
        })
      }

      async function movingTargets(count: number): Promise<User[]> {
        const targets: User[] = []
        for (let i = 0; i < count; i++) {
          targets.push(await User.create({ email: `batchmover${i}@target`, password: 'howyadoin' }))
        }
        return targets
      }

      it('abandons the batch rather than claiming rows under the wrong scope locks', async () => {
        const post = await Post.create({ body: 'A', user })
        moveCandidateAfterEachAcquisition(post, await movingTargets(MAX_SCOPE_STABILIZATION_ROUNDS + 1))

        await expect(Post.where({ id: post.id }).destroy({ lock: true })).rejects.toThrow(
          SortableScopeDidNotStabilize
        )

        expect(await Post.count()).toEqual(1)
      })

      it('destroys the batch when the candidates stop moving on the final acquisition', async () => {
        const post = await Post.create({ body: 'A', user })
        // one fewer move than the bound allows acquisitions: the last permitted
        // acquisition is undisturbed, and the re-read taken after it agrees
        const targets = await movingTargets(MAX_SCOPE_STABILIZATION_ROUNDS - 1)
        moveCandidateAfterEachAcquisition(post, targets)

        expect(await Post.where({ id: post.id }).destroy({ lock: true })).toEqual(1)

        expect(await Post.count()).toEqual(0)
      })
    })

    // Deadlock is prevented by the acquisition order being one order, not by
    // anything observable while two callers are racing: each pass takes its
    // whole key set in a single statement, so two callers can only interleave
    // inside the server's execution of those two statements — a window no spec
    // can hold open. What *is* deterministic is the order the statements carry,
    // and that is the property the freedom from deadlock rests on.
    it('two locked batches that derive the same two keys in opposite orders acquire them in one identical order', async () => {
      const postA = await Post.create({ body: 'A', user })
      const postB = await Post.create({ body: 'B', user: user2 })
      const statements = recordScopeLockStatements()

      // each batch derives its candidate's current scope first and the scope
      // its attributes move that candidate into second, so the two derive the
      // same pair of keys in opposite orders
      expect(await Post.where({ id: postA.id }).update({ userId: user2.id }, { lock: true })).toEqual(1)
      expect(await Post.where({ id: postB.id }).update({ userId: user.id }, { lock: true })).toEqual(1)

      const preflights = statements.filter(keys => keys.length > 1)
      expect(preflights).toHaveLength(2)
      expect(new Set(preflights[0])).toEqual(
        new Set([postScopeKey(postA, user.id), postScopeKey(postA, user2.id)])
      )
      expect(preflights[0]).toEqual(preflights[1])
    })

    it('a second locked batch over the same two scopes waits for the first', async () => {
      const postA1 = await Post.create({ body: 'A1', user })
      const postB1 = await Post.create({ body: 'B1', user: user2 })
      const postA2 = await Post.create({ body: 'A2', user })
      const postB2 = await Post.create({ body: 'B2', user: user2 })

      let competingDestroySettled = false
      const competingDestroys: Promise<number>[] = []

      interposeAfterScopeLockAcquired(async () => {
        competingDestroys.push(
          Post.where({ id: [postA2.id, postB2.id] })
            .destroy({ lock: true })
            .then(count => {
              competingDestroySettled = true
              return count
            })
        )

        await new Promise(resolve => setTimeout(resolve, BLOCKED_WRITER_GRACE_MS))
        expect(competingDestroySettled).toBe(false)
      })

      expect(await Post.where({ id: [postA1.id, postB1.id] }).destroy({ lock: true })).toEqual(2)
      const [competingCount] = await Promise.all(competingDestroys)

      expect(competingCount).toEqual(2)
      expect(await Post.count()).toEqual(0)
    }, 15000)
  })

  context('round trips inside the lock window', () => {
    /**
     * Every per-record sortable snapshot SELECT against `posts` — the read
     * `readSortableSnapshots` issues by primary key, told apart from the batch
     * preflight's read of the same columns by its `=` rather than `in`.
     */
    function recordSnapshotSelects(): string[] {
      const selects: string[] = []
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalQuery = pg.Client.prototype.query

      vi.spyOn(pg.Client.prototype as any, 'query').mockImplementation(function (
        this: pg.Client,
        ...args: unknown[]
      ) {
        const sql = args[0]
        if (typeof sql === 'string' && /^select "position", "user_id" from "posts" where "id" = /.test(sql))
          selects.push(sql)

        return (originalQuery as (...callArgs: unknown[]) => unknown).apply(this, args)
      } as any)

      return selects
    }

    /**
     * Every SQL statement that takes advisory locks, as the driver sends it.
     */
    function recordAdvisoryLockSql(): string[] {
      const statements: string[] = []
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalQuery = pg.Client.prototype.query

      vi.spyOn(pg.Client.prototype as any, 'query').mockImplementation(function (
        this: pg.Client,
        ...args: unknown[]
      ) {
        const sql = args[0]
        if (typeof sql === 'string' && sql.includes('pg_advisory_xact_lock')) statements.push(sql)

        return (originalQuery as (...callArgs: unknown[]) => unknown).apply(this, args)
      } as any)

      return statements
    }

    function ascending(keys: bigint[]): bigint[] {
      return [...keys].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    }

    it('takes a locked batch’s whole key set in one statement rather than one per key', async () => {
      const user3 = await User.create({ email: 'roygbiv@roygbiv', password: 'howyadoin' })
      const postA = await Post.create({ body: 'A', user })
      const postB = await Post.create({ body: 'B', user: user2 })
      const postC = await Post.create({ body: 'C', user: user3 })

      const statements = recordScopeLockStatements()
      const advisorySql = recordAdvisoryLockSql()

      expect(await Post.where({ id: [postA.id, postB.id, postC.id] }).destroy({ lock: true })).toEqual(3)

      // three candidates in three different sort scopes, so three keys — asked
      // for once, as one set, and sent to the database as one statement rather
      // than one per key. The per-record work that follows asks for nothing the
      // transaction is not already holding
      expect(statements).toHaveLength(1)
      expect(statements[0]).toEqual(
        ascending([
          postScopeKey(postA, user.id),
          postScopeKey(postB, user2.id),
          postScopeKey(postC, user3.id),
        ])
      )
      expect(advisorySql).toHaveLength(1)
    })

    it('issues no second acquisition statement for a key the transaction already holds', async () => {
      const post = await Post.create({ body: 'A', user })
      await Post.create({ body: 'B', user })

      const statements = recordScopeLockStatements()

      await post.update({ position: 2 })

      // one statement, taken by the save's sortable phase before the driver
      // UPDATE; the position write that follows it asks for the same key and
      // issues nothing at all
      expect(statements).toEqual([[postScopeKey(post, user.id)]])
    })

    it('consumes the locked batch’s preflight read instead of re-reading a row it already covered', async () => {
      await Post.create({ body: 'A', user })
      await Post.create({ body: 'B', user })
      await Post.create({ body: 'C', user })

      const snapshotSelects = recordSnapshotSelects()

      expect(await Post.where({ userId: user.id }).destroy({ lock: true })).toEqual(3)

      // the first record's snapshot is the row the preflight already read, in
      // this transaction and under these very locks. Its compaction then shifts
      // every surviving row in the scope, so the two records after it read their
      // own rows again: the cache is dropped by any position write and is never
      // consulted across one
      expect(snapshotSelects).toHaveLength(2)
    })
  })

  context('the preflight row cache', () => {
    it('does not compute a later record’s shift from the position the preflight read it with', async () => {
      for (const body of ['A', 'B', 'C', 'D']) await Post.create({ body, user })

      // the preflight reads A, B and C at positions 1, 2 and 3; A's move out of
      // the scope then compacts every one of them down, so B and C are walked
      // holding positions the rows no longer have
      expect(
        await Post.where({ userId: user.id, body: ['A', 'B', 'C'] }).update(
          { userId: user2.id },
          { lock: true }
        )
      ).toEqual(3)

      expect(
        (await Post.where({ userId: user.id }).order('position').all()).map(post => post.position)
      ).toEqual([1])
      expect(
        (await Post.where({ userId: user2.id }).order('position').all()).map(post => post.position)
      ).toEqual([1, 2, 3])
    })

    it('does not let a locked batch’s cached rows survive into the rest of a caller-owned transaction', async () => {
      await Post.create({ body: 'A', user })
      await Post.create({ body: 'B', user })
      const postC = await Post.create({ body: 'C', user })
      await Post.create({ body: 'X', user: user2 })
      const postY = await Post.create({ body: 'Y', user: user2 })

      await ApplicationModel.transaction(async txn => {
        // an attribute update that touches neither the position nor the sort
        // scope performs no position work, so nothing inside the batch consumes
        // or drops what the preflight cached: the batch's own invalidation is
        // the only thing standing between those rows and the rest of this
        // transaction
        await Post.txn(txn).where({ userId: user.id }).update({ body: 'touched' }, { lock: true })

        // a writer that skips hooks moves a record between sort scopes without
        // going through the sortable path at all, so nothing it does
        // invalidates anything
        await Post.txn(txn).where({ id: postY.id }).update({ position: 3 }, { skipHooks: true })
        await Post.txn(txn)
          .where({ id: postC.id })
          .update({ userId: user2.id, position: 2 }, { skipHooks: true })

        // C now really sits in user2's scope at position 2, with a survivor
        // above it; the preflight read it in user's scope at position 3
        await postC.txn(txn).destroy()
      })

      expect(
        (await Post.where({ userId: user2.id }).order('position').all()).map(post => post.position)
      ).toEqual([1, 2])
      expect(
        (await Post.where({ userId: user.id }).order('position').all()).map(post => post.position)
      ).toEqual([1, 2])
    })
  })

  context('Dream.resort', () => {
    it('renumbers from a read taken under the lock, not from its unlocked candidate pass', async () => {
      const postA = await Post.create({ body: 'A', user })
      await Post.create({ body: 'B', user })
      await Post.create({ body: 'C', user })
      await Post.where({ id: postA.id }).update({ position: 7 }, { skipHooks: true })

      let disturbed = false

      // a writer commits into the group after resort's unlocked whole-table read
      // and before resort locks that group
      interposeBeforeScopeLockAcquired(async () => {
        disturbed = true
        await Post.create({ body: 'D', user })
      })

      await Post.resort('position')

      expect(disturbed).toBe(true)
      expect(
        (await Post.where({ userId: user.id }).order('position').all()).map(post => post.position)
      ).toEqual([1, 2, 3, 4])
    }, 15000)

    it('repairs a sort scope that looked contiguous in the candidate pass and was disturbed before the lock', async () => {
      await Post.create({ body: 'A', user })
      const postB = await Post.create({ body: 'B', user })

      // the candidate pass sees 1, 2 — a scope with nothing wrong with it, and
      // the only thing that can catch the hole opened below is locking and
      // re-reading it anyway
      let disturbed = false

      interposeBeforeScopeLockAcquired(async () => {
        disturbed = true
        await Post.where({ id: postB.id }).update({ position: 5 }, { skipHooks: true })
      })

      await Post.resort('position')

      expect(disturbed).toBe(true)
      expect(
        (await Post.where({ userId: user.id }).order('position').all()).map(post => post.position)
      ).toEqual([1, 2])
    }, 15000)

    it('discovers sort scopes by plucking, and renumbers each disturbed scope in one statement', async () => {
      await Post.create({ body: 'A', user })
      await Post.create({ body: 'B', user })
      await Post.create({ body: 'C', user })
      // a second sort scope, left contiguous, so that only one of the two is
      // renumbered
      await Post.create({ body: 'D', user: user2 })

      await Post.where({ userId: user.id })
        .toKysely('update')
        .set((eb: ExpressionBuilder<any, any>) => ({ position: eb('position', '+', 100) }))
        .execute()

      const hydratedReads = vi.spyOn(Query.prototype, 'all')
      const kyselyBuilders = vi.spyOn(Query.prototype, 'toKysely')

      await Post.resort('position')

      expect(hydratedReads).not.toHaveBeenCalled()
      expect(kyselyBuilders.mock.calls.filter(([type]) => type === 'update')).toHaveLength(1)

      expect(
        (await Post.where({ userId: user.id }).order('position').all()).map(post => post.position)
      ).toEqual([1, 2, 3])
      expect(
        (await Post.where({ userId: user2.id }).order('position').all()).map(post => post.position)
      ).toEqual([1])
    })

    context('group identity (G12a)', () => {
      it('does not merge two scope tuples whose values collide when joined', async () => {
        const first = await TextScopedSortableModel.create({ scopeA: 'a:b', scopeB: 'c' })
        const second = await TextScopedSortableModel.create({ scopeA: 'a:b', scopeB: 'c' })
        const third = await TextScopedSortableModel.create({ scopeA: 'a', scopeB: 'b:c' })
        const fourth = await TextScopedSortableModel.create({ scopeA: 'a', scopeB: 'b:c' })

        await makeGroupNonContiguous([first, second, third, fourth])
        const keys = recordScopeLockKeys()

        await TextScopedSortableModel.resort('position')

        expect(await positionsFor({ scopeA: 'a:b', scopeB: 'c' })).toEqual([1, 2])
        expect(await positionsFor({ scopeA: 'a', scopeB: 'b:c' })).toEqual([1, 2])
        // one key per physical scope, not one key for the merged bucket
        expect(new Set(keys).size).toEqual(2)
      })

      it('does not merge a null scope member with an empty-string one', async () => {
        const first = await TextScopedSortableModel.create({ scopeA: null, scopeB: 'x' })
        const second = await TextScopedSortableModel.create({ scopeA: null, scopeB: 'x' })
        const third = await TextScopedSortableModel.create({ scopeA: '', scopeB: 'x' })
        const fourth = await TextScopedSortableModel.create({ scopeA: '', scopeB: 'x' })

        await makeGroupNonContiguous([first, second, third, fourth])
        const keys = recordScopeLockKeys()

        await TextScopedSortableModel.resort('position')

        // the null group is re-read under the lock with `IS NULL`, or it would
        // come back empty and be silently skipped
        expect(await positionsFor({ scopeA: null, scopeB: 'x' })).toEqual([1, 2])
        expect(await positionsFor({ scopeA: '', scopeB: 'x' })).toEqual([1, 2])
        expect(new Set(keys).size).toEqual(2)
      })
    })

    context('STI (G12b)', () => {
      it('renumbers the whole hierarchy position space rather than one child subset', async () => {
        const mylarA = await Mylar.create({ user })
        const latexA = await Latex.create({ user })
        const mylarB = await Mylar.create({ user })
        const latexB = await Latex.create({ user })

        expect(
          [mylarA, latexA, mylarB, latexB].map(balloon => balloon.positionAlpha!).sort((a, b) => a - b)
        ).toEqual([1, 2, 3, 4])

        await Balloon.where({ id: mylarA.id }).update({ positionAlpha: 9 }, { skipHooks: true })

        await Mylar.resort('positionAlpha')

        const positions = (await Balloon.where({ userId: user.id }).order('positionAlpha').all()).map(
          balloon => balloon.positionAlpha
        )

        expect(positions).toEqual([1, 2, 3, 4])
        expect(new Set(positions).size).toEqual(positions.length)
      })
    })
  })
})

/**
 * Pushes every record's position out of the contiguous 1..n range its own scope
 * requires, so that `resort` has work to do in every group.
 */
async function makeGroupNonContiguous(records: TextScopedSortableModel[]) {
  let position = 10
  for (const record of records) {
    await TextScopedSortableModel.where({ id: record.id }).update(
      { position: position++ },
      { skipHooks: true }
    )
  }
}

async function positionsFor(scope: { scopeA: string | null; scopeB: string }) {
  return (await TextScopedSortableModel.where(scope).order('position').all()).map(record => record.position)
}
