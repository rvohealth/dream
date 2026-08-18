import pg from 'pg'
import Dream from '../../../../src/Dream.js'
import { MAX_SCOPE_STABILIZATION_ROUNDS } from '../../../../src/decorators/field/sortable/helpers/stabilizeSortableScopeLocks.js'
import DreamTransaction from '../../../../src/dream/DreamTransaction.js'
import KyselyQueryDriver from '../../../../src/dream/QueryDriver/Kysely.js'
import PostgresQueryDriver from '../../../../src/dream/QueryDriver/Postgres.js'
import RecordNotFound from '../../../../src/errors/RecordNotFound.js'
import SortableScopeDidNotStabilize from '../../../../src/errors/SortableScopeDidNotStabilize.js'
import { DateTime } from '../../../../src/utils/datetime/DateTime.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import Post from '../../../../test-app/app/models/Post.js'
import TextScopedSortableModel from '../../../../test-app/app/models/TextScopedSortableModel.js'
import User from '../../../../test-app/app/models/User.js'

/**
 * Every position-mutating path computes its shift from the row as it physically
 * exists, not from the position and scope an in-memory instance was loaded
 * with. These specs all work the same way: a record's row is moved out from
 * under an instance, and the instance is then used to destroy, update or
 * undestroy.
 */
describe('@Sortable staleness', () => {
  let user: User
  let user2: User
  let user3: User

  beforeEach(async () => {
    user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
    user2 = await User.create({ email: 'chalupas@johnson', password: 'howyadoin' })
    user3 = await User.create({ email: 'tacos@johnson', password: 'howyadoin' })
  })

  async function positionsFor(forUser: User): Promise<(number | null)[]> {
    return (await Post.where({ userId: forUser.id }).order('position').all()).map(post => post.position)
  }

  async function createPosts(forUser: User, count: number): Promise<Post[]> {
    const posts: Post[] = []
    for (let i = 0; i < count; i++) posts.push(await Post.create({ body: `post ${i}`, user: forUser }))
    return posts
  }

  context('destroying records that were all loaded before the first destroy', () => {
    it('leaves the remaining positions contiguous, with no gaps and no duplicates', async () => {
      const [post1, post2, post3] = await createPosts(user, 5)

      // each destroy shifts the ones above it down, so by the third destroy the
      // instance's remembered position is two higher than the row's real one
      await post1!.destroy()
      await post2!.destroy()
      await post3!.destroy()

      expect(await positionsFor(user)).toEqual([1, 2])
    })

    it('holds through Query#destroy, which loads a batch and destroys it one record at a time', async () => {
      // the doomed records take the bottom of the scope and the survivors sit
      // above them, so a shift computed from a position the instance remembers
      // rather than the one its row physically holds lands on an occupied slot
      // instead of harmlessly off the end: the stale code leaves [2, 4]
      for (let i = 0; i < 3; i++) await Post.create({ body: 'doomed', user }) // 1, 2, 3
      await createPosts(user, 2) // 4, 5

      await Post.where({ body: 'doomed' }).destroy()

      expect(await positionsFor(user)).toEqual([1, 2])
    })
  })

  context("when the record's real position is higher than the instance remembers", () => {
    it('shifts the range the row actually vacated', async () => {
      const [post1, post2, post3, post4] = await createPosts(user, 4)

      // post4 moves to the front, raising every other record's real position by
      // one. post2's instance still remembers position 2; its row is now at 3.
      await post4!.update({ position: 1 })

      await post2!.destroy()

      expect(await positionsFor(user)).toEqual([1, 2, 3])
      expect((await Post.findOrFail(post4!.id)).position).toEqual(1)
      expect((await Post.findOrFail(post1!.id)).position).toEqual(2)
      expect((await Post.findOrFail(post3!.id)).position).toEqual(3)
    })
  })

  context('an update that moves a position', () => {
    it('derives its shift range from the database rather than from the instance', async () => {
      const [post1, post2, post3] = await createPosts(user, 3)
      const stalePost1 = await Post.findOrFail(post1!.id)

      // post3 moves to the front: stalePost1's row is now at 2, while the
      // instance still remembers 1
      await post3!.update({ position: 1 })

      await stalePost1.update({ position: 3 })

      expect(await positionsFor(user)).toEqual([1, 2, 3])
      expect((await Post.findOrFail(post3!.id)).position).toEqual(1)
      expect((await Post.findOrFail(post2!.id)).position).toEqual(2)
      expect((await Post.findOrFail(post1!.id)).position).toEqual(3)
    })
  })

  context('an undestroy', () => {
    it('computes the next position within the scope the row actually occupies', async () => {
      const [post1] = await createPosts(user, 2)
      await createPosts(user2, 3)

      await post1!.destroy()

      // the soft deleted row is moved into user2's scope while the instance
      // still remembers user's
      const movedPost = await Post.removeAllDefaultScopes().findOrFail(post1!.id)
      await movedPost.update({ user: user2 }, { skipHooks: true })

      await post1!.undestroy()

      expect((await Post.findOrFail(post1!.id)).position).toEqual(4)
      expect(await positionsFor(user2)).toEqual([1, 2, 3, 4])
    })

    it('leaves a soft deleted row at a NULL position, unrenumbered by later destroys', async () => {
      const [, post2] = await createPosts(user, 3)

      await post2!.destroy()
      expect((await Post.removeAllDefaultScopes().findOrFail(post2!.id)).position).toBeNull()

      const [post1] = await Post.where({ userId: user.id }).order('position').all()
      await post1!.destroy()

      expect((await Post.removeAllDefaultScopes().findOrFail(post2!.id)).position).toBeNull()
      expect(await positionsFor(user)).toEqual([1])
    })
  })

  context('when the row was moved to another sort scope after the instance was loaded', () => {
    it('compacts the scope the row actually occupies and leaves the loaded-from scope untouched', async () => {
      const [, postA2, postA3] = await createPosts(user, 3)
      const [postB1, postB2, postB3] = await createPosts(user2, 3)

      // postA2's row is moved into user2's scope at position 2, without going
      // through Sortable — its in-memory instance still says user, position 2
      await ApplicationModel.transaction(async txn => {
        const mover = await Post.txn(txn).findOrFail(postA2!.id)
        await postB3!.txn(txn).update({ position: 4 }, { skipHooks: true })
        await postB2!.txn(txn).update({ position: 3 }, { skipHooks: true })
        await mover.txn(txn).update({ user: user2, position: 2 }, { skipHooks: true })
      })

      await postA2!.destroy()

      // the scope it actually occupied is compacted...
      expect(await positionsFor(user2)).toEqual([1, 2, 3])
      expect((await Post.findOrFail(postB1!.id)).position).toEqual(1)
      expect((await Post.findOrFail(postB2!.id)).position).toEqual(2)
      expect((await Post.findOrFail(postB3!.id)).position).toEqual(3)

      // ...and the scope it was loaded from is not. Its physical hole at
      // position 2 is not this destroy's to close, for three reasons. A
      // destroy owes closure only for the vacancy it creates, and it creates
      // one only where the row physically was — which is what the snapshot
      // read under the scope lock establishes; the hole here predates the
      // destroy, left by the skipHooks writer that moved the row out without
      // Sortable's bookkeeping, and holes like it are `Dream.resort`'s to
      // repair. Closing it would also be unsafe: the destroy holds no advisory
      // lock on this scope, so the shift would race the scope's writers
      // unserialized, from a remembered position the instance cannot vouch
      // for. And when a scope move goes through Sortable properly, the old
      // scope is compacted at move time and holds no hole at all — a destroy
      // that compacted the scope its instance was loaded from would shift that
      // contiguous scope's rows down onto still-occupied positions, a
      // guaranteed duplicate with no concurrency involved.
      expect(await positionsFor(user)).toEqual([1, 3])
      expect((await Post.findOrFail(postA3!.id)).position).toEqual(3)
    })

    it('leaves the destination contiguous when a save moves the instance into the scope the row already occupies', async () => {
      const [, postA2] = await createPosts(user, 3)
      const [postB1, postB2, postB3] = await createPosts(user2, 3)

      const stalePost = await Post.findOrFail(postA2!.id)

      // a competing writer moves the row into user2's scope at position 1, so
      // the instance's pending scope change and the row's real scope are the
      // same scope: nothing joins the destination, and its max is already the
      // end of it
      await ApplicationModel.transaction(async txn => {
        await postB3!.txn(txn).update({ position: 4 }, { skipHooks: true })
        await postB2!.txn(txn).update({ position: 3 }, { skipHooks: true })
        await postB1!.txn(txn).update({ position: 2 }, { skipHooks: true })
        const mover = await Post.txn(txn).findOrFail(postA2!.id)
        await mover.txn(txn).update({ user: user2, position: 1 }, { skipHooks: true })
      })

      await stalePost.update({ user: user2 })

      expect(await positionsFor(user2)).toEqual([1, 2, 3, 4])
    })

    it('leaves the record last when the scope the row already occupies is one it is already last in', async () => {
      const [, postA2] = await createPosts(user, 3)
      const [postB1, postB2, postB3] = await createPosts(user2, 3)

      const stalePost = await Post.findOrFail(postA2!.id)

      // the row is moved to the end of user2's scope, so the instance's pending
      // scope change lands on a scope the record already occupies *and* is
      // already the last record in: it lands at the end of the destination, as
      // every scope-changing save does, which here means it does not move at all
      const mover = await Post.findOrFail(postA2!.id)
      await mover.update({ user: user2, position: 4 }, { skipHooks: true })

      await stalePost.update({ user: user2 })

      expect(await positionsFor(user2)).toEqual([1, 2, 3, 4])
      expect((await Post.findOrFail(postB1!.id)).position).toEqual(1)
      expect((await Post.findOrFail(postB2!.id)).position).toEqual(2)
      expect((await Post.findOrFail(postB3!.id)).position).toEqual(3)
      expect((await Post.findOrFail(postA2!.id)).position).toEqual(4)
    })
  })

  context('when the row moves between the pre-lock key read and the lock (G7)', () => {
    it('re-locks on the scope the row actually occupies rather than compacting the one it left', async () => {
      const [, postA2, postA3] = await createPosts(user, 3)
      const [postB1, postB2] = await createPosts(user2, 2)
      // user3 is the scope being written into; it is deliberately as deep as the
      // scope being left, so that the compaction range is not clipped by the
      // pre-existing narrow-range defect on scope-shrinking moves
      await createPosts(user3, 2)

      const stalePost = await Post.findOrFail(postA2!.id)
      const acquiredKeys: bigint[] = []

      // The first lock key can only come from the instance, because the row
      // cannot be read safely until something is locked. Move the row *after*
      // that key was chosen and locked, so the snapshot read under it disagrees
      // and the save has to take the key it did not know it needed.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalLock = PostgresQueryDriver.acquireAdvisoryTransactionLocks
      let locks = 0
      vi.spyOn(PostgresQueryDriver, 'acquireAdvisoryTransactionLocks').mockImplementation(async function (
        txn: DreamTransaction<any>,
        keys: bigint[]
      ) {
        acquiredKeys.push(...keys)
        await originalLock.call(PostgresQueryDriver, txn, keys)

        if (++locks === 1) {
          await ApplicationModel.transaction(async moveTxn => {
            const mover = await Post.txn(moveTxn).findOrFail(postA2!.id)
            await postB2!.txn(moveTxn).update({ position: 3 }, { skipHooks: true })
            await mover.txn(moveTxn).update({ user: user2, position: 2 }, { skipHooks: true })
          })
        }
      })

      await stalePost.update({ user: user3 })

      // three distinct scopes were locked: the one being written (user3), the
      // one the instance believed it was leaving (user), and the one the
      // snapshot revealed the row had been moved into (user2). Without the
      // stabilization round the third is never taken.
      expect(new Set(acquiredKeys).size).toEqual(3)

      // the scope the row really occupied is the one compacted
      expect(await positionsFor(user2)).toEqual([1, 2])
      expect((await Post.findOrFail(postB1!.id)).position).toEqual(1)
      expect((await Post.findOrFail(postB2!.id)).position).toEqual(2)

      // the scope the instance was loaded from keeps its physical hole
      expect(await positionsFor(user)).toEqual([1, 3])
      expect((await Post.findOrFail(postA3!.id)).position).toEqual(3)

      // and the record lands at the end of the scope it was moved into
      expect(await positionsFor(user3)).toEqual([1, 2, 3])
      expect((await Post.findOrFail(postA2!.id)).position).toEqual(3)
    })

    it('stabilizes rather than raising when the row stops moving on the final acquisition', async () => {
      const [postA1, postA2] = await createPosts(user, 2)
      // one fewer moving target than the bound allows acquisitions, so the last
      // acquisition the bound permits is undisturbed and the read taken under it
      // agrees: the operation converges on its final round rather than having
      // that round's work discarded
      const movingTargets: User[] = []
      for (let i = 0; i < MAX_SCOPE_STABILIZATION_ROUNDS - 1; i++) {
        movingTargets.push(await User.create({ email: `settling${i}@target`, password: 'howyadoin' }))
      }

      const stalePost = await Post.findOrFail(postA2!.id)
      const acquiredKeys: bigint[] = []

      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalLock = PostgresQueryDriver.acquireAdvisoryTransactionLocks
      let moves = 0
      vi.spyOn(PostgresQueryDriver, 'acquireAdvisoryTransactionLocks').mockImplementation(async function (
        txn: DreamTransaction<any>,
        keys: bigint[]
      ) {
        acquiredKeys.push(...keys)
        await originalLock.call(PostgresQueryDriver, txn, keys)

        const target = movingTargets[moves++]
        if (target) {
          const mover = await Post.findOrFail(postA2!.id)
          await mover.update({ user: target, position: 1 }, { skipHooks: true })
        }
      })

      await expect(stalePost.update({ position: 1 })).resolves.toBeUndefined()

      // one key per scope the row passed through — the one the instance implied
      // and one per move — all of them taken within the bound
      expect(new Set(acquiredKeys).size).toEqual(MAX_SCOPE_STABILIZATION_ROUNDS)
      expect((await Post.removeAllDefaultScopes().findOrFail(postA2!.id)).userId).toEqual(
        movingTargets.at(-1)!.id
      )
      // the scope the instance was loaded from is untouched by a save that
      // followed the row out of it
      expect((await Post.findOrFail(postA1!.id)).position).toEqual(1)
    })

    it('raises rather than compacting the wrong scope when the row will not stop moving', async () => {
      const [, postA2] = await createPosts(user, 2)
      const movingTargets: User[] = []
      for (let i = 0; i < 5; i++) {
        movingTargets.push(await User.create({ email: `moving${i}@target`, password: 'howyadoin' }))
      }

      const stalePost = await Post.findOrFail(postA2!.id)

      // a competing writer moves the row to a scope nobody has locked yet, every
      // single time a lock is taken, so the snapshot never agrees with the key
      // set that was acquired
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
          const mover = await Post.findOrFail(postA2!.id)
          await mover.update({ user: target, position: 1 }, { skipHooks: true })
        }
      })

      await expect(stalePost.update({ position: 1 })).rejects.toThrow(SortableScopeDidNotStabilize)

      // the save was abandoned, so no scope was compacted on a guess
      expect(await positionsFor(user)).toEqual([1])
    })
  })

  context('a destroy that removes nothing because the row is already gone', () => {
    async function textScopedPositions(): Promise<(number | null)[]> {
      return (
        await TextScopedSortableModel.where({ scopeA: 'alpha', scopeB: 'beta' }).order('position').all()
      ).map(record => record.position)
    }

    async function createTextScoped(count: number): Promise<TextScopedSortableModel[]> {
      const records: TextScopedSortableModel[] = []
      for (let i = 0; i < count; i++) {
        records.push(await TextScopedSortableModel.create({ scopeA: 'alpha', scopeB: 'beta' }))
      }
      return records
    }

    async function positionsForSpecies(species: string): Promise<(number | null)[]> {
      return (
        await Pet.where({ species: species as any })
          .order('positionWithinSpecies')
          .all()
      ).map(pet => pet.positionWithinSpecies)
    }

    it('leaves sibling positions alone on a second sequential hard destroy', async () => {
      const [record1] = await createTextScoped(3)

      await record1!.destroy()
      expect(await textScopedPositions()).toEqual([1, 2])

      // the row is gone, so this destroy vacates nothing — the scope must not be
      // compacted a second time from the instance's remembered position
      await record1!.destroy()

      expect(await textScopedPositions()).toEqual([1, 2])
    })

    it('leaves sibling positions alone when reallyDestroy is called twice on a soft delete model', async () => {
      const cat1 = await Pet.create({ species: 'cat', name: 'one' })
      await Pet.create({ species: 'cat', name: 'two' })
      await Pet.create({ species: 'cat', name: 'three' })

      await cat1.reallyDestroy()
      expect(await positionsForSpecies('cat')).toEqual([1, 2])

      await cat1.reallyDestroy()

      expect(await positionsForSpecies('cat')).toEqual([1, 2])
    })

    it('leaves survivors contiguous when the row is removed between the snapshot and the delete', async () => {
      const [record1] = await createTextScoped(3)

      // A writer that never touches the sortable path — a raw delete plus the
      // compaction it implies — removes the row after this destroy has taken its
      // scope lock and read its snapshot, but before its own DELETE runs. No
      // advisory key is involved, so the snapshot cannot protect against it and
      // only the delete's affected-row count can.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalDestroyDream = KyselyQueryDriver.destroyDream
      vi.spyOn(KyselyQueryDriver, 'destroyDream').mockImplementation(async function (
        dream: Dream,
        txn: DreamTransaction<any>,
        reallyDestroy: boolean
      ) {
        await ApplicationModel.transaction(async competingTxn => {
          await competingTxn.kyselyTransaction
            .deleteFrom('text_scoped_sortable_models')
            .where('id', '=', record1!.id as any)
            .execute()

          await competingTxn.kyselyTransaction
            .updateTable('text_scoped_sortable_models')
            .set(eb => ({ position: eb('position', '-', 1) }))
            .where('scopeA', '=', 'alpha')
            .where('scopeB', '=', 'beta')
            .where('position', '>', 1)
            .execute()
        })

        return await originalDestroyDream.call(KyselyQueryDriver, dream, txn, reallyDestroy)
      })

      await record1!.destroy()

      expect(await textScopedPositions()).toEqual([1, 2])
    })

    it('leaves survivors contiguous when the snapshot found no row and a re-inserted row made the delete remove one', async () => {
      const [record1] = await createTextScoped(3)

      // The row is removed, and the vacancy it left closed, by a writer that
      // never touches the sortable path, so this destroy's snapshot read finds
      // nothing to vacate. A row then reappears under the same primary key
      // before the destroy's own DELETE runs, and the DELETE removes it: the
      // affected-row count reports a row removed for a position this destroy
      // never held, and the snapshot's existence signal is the only one that
      // keeps the scope from being compacted a second time.
      await ApplicationModel.transaction(async competingTxn => {
        await competingTxn.kyselyTransaction
          .deleteFrom('text_scoped_sortable_models')
          .where('id', '=', record1!.id as any)
          .execute()

        await competingTxn.kyselyTransaction
          .updateTable('text_scoped_sortable_models')
          .set(eb => ({ position: eb('position', '-', 1) }))
          .where('scopeA', '=', 'alpha')
          .where('scopeB', '=', 'beta')
          .where('position', '>', 1)
          .execute()
      })

      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalDestroyDream = KyselyQueryDriver.destroyDream
      vi.spyOn(KyselyQueryDriver, 'destroyDream').mockImplementation(async function (
        dream: Dream,
        txn: DreamTransaction<any>,
        reallyDestroy: boolean
      ) {
        await ApplicationModel.transaction(async competingTxn => {
          await competingTxn.kyselyTransaction
            .insertInto('text_scoped_sortable_models')
            .values({
              id: record1!.id as any,
              scopeA: 'alpha',
              scopeB: 'beta',
              position: 3,
              createdAt: DateTime.now(),
              updatedAt: DateTime.now(),
            })
            .execute()
        })

        return await originalDestroyDream.call(KyselyQueryDriver, dream, txn, reallyDestroy)
      })

      await record1!.destroy()

      expect(await textScopedPositions()).toEqual([1, 2])
    })

    it('still runs the veto path when preventDeletion was set outside the beforeDestroy hooks', async () => {
      const [record1] = await createTextScoped(3)

      record1!.preventDeletion()
      await record1!.destroy({ skipHooks: true })

      expect(await TextScopedSortableModel.find(record1!.id)).not.toBeNull()
      expect(await textScopedPositions()).toEqual([1, 2, 3])
    })

    /**
     * Every statement that writes a `posts` position, as the driver sends it —
     * both the compaction (`set "position" = "position" - 1`) and the write of
     * a single record's own position.
     */
    function recordPositionWrites(): string[] {
      const statements: string[] = []
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalQuery = pg.Client.prototype.query

      vi.spyOn(pg.Client.prototype as any, 'query').mockImplementation(function (
        this: pg.Client,
        ...args: unknown[]
      ) {
        const sql = args[0]
        if (typeof sql === 'string' && /^update "posts" set "position" = /.test(sql)) statements.push(sql)

        return (originalQuery as (...callArgs: unknown[]) => unknown).apply(this, args)
      } as any)

      return statements
    }

    it('vacates nothing when the row it removes holds no position', async () => {
      const [post1] = await createPosts(user, 3)

      // the soft delete nulls the position column and closes the gap it left,
      // so the row this hard destroy removes has no position to vacate
      await post1!.destroy()
      expect(await positionsFor(user)).toEqual([1, 2])
      expect((await Post.removeAllDefaultScopes().findOrFail(post1!.id)).position).toBeNull()

      const positionWrites = recordPositionWrites()
      await post1!.reallyDestroy()

      // not merely "the survivors did not move": a compaction from a NULL
      // position matches no row, so only the absence of the statement itself
      // distinguishes the guard from its absence
      expect(positionWrites).toEqual([])
      expect(await positionsFor(user)).toEqual([1, 2])
    })

    it('still raises RecordNotFound when a soft delete model destroys a hard-gone row', async () => {
      const cat1 = await Pet.create({ species: 'cat', name: 'one' })
      await Pet.create({ species: 'cat', name: 'two' })

      await cat1.reallyDestroy()

      await expect(cat1.destroy()).rejects.toThrow(RecordNotFound)
      expect(await positionsForSpecies('cat')).toEqual([1])
    })
  })
})
