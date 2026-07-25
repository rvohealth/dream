import { MockInstance } from 'vitest'
import DreamDbConnection from '../../../src/db/DreamDbConnection.js'
import ReplicaSafe from '../../../src/decorators/class/ReplicaSafe.js'
import { blankHooksFactory } from '../../../src/decorators/field/lifecycle/shared.js'
import Dream from '../../../src/Dream.js'
import DreamTransaction from '../../../src/dream/DreamTransaction.js'
import * as destroyAssociatedRecordsModule from '../../../src/dream/internal/destroyAssociatedRecords.js'
import * as runHooksForModule from '../../../src/dream/internal/runHooksFor.js'
import KyselyQueryDriver from '../../../src/dream/QueryDriver/Kysely.js'
import PostgresQueryDriver from '../../../src/dream/QueryDriver/Postgres.js'
import InvalidBatchSize from '../../../src/errors/InvalidBatchSize.js'
import RowLockIncompatibleWithDistinct from '../../../src/errors/RowLockIncompatibleWithDistinct.js'
import { HookStatement } from '../../../src/types/lifecycle.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Balloon from '../../../test-app/app/models/Balloon.js'
import Mylar from '../../../test-app/app/models/Balloon/Mylar.js'
import Composition from '../../../test-app/app/models/Composition.js'
import HeartRating from '../../../test-app/app/models/ExtraRating/HeartRating.js'
import LocalizedText from '../../../test-app/app/models/LocalizedText.js'
import ModelWithSerialPrimaryKey from '../../../test-app/app/models/ModelWithSerialPrimaryKey.js'
import Pet from '../../../test-app/app/models/Pet.js'
import Post from '../../../test-app/app/models/Post.js'
import PostVisibility from '../../../test-app/app/models/PostVisibility.js'
import Rating from '../../../test-app/app/models/Rating.js'
import User from '../../../test-app/app/models/User.js'

describe('Query#destroy', () => {
  let hooksSpy: MockInstance
  let cascadeSpy: MockInstance

  function expectDestroyHooksCalled(dream: Dream) {
    expect(hooksSpy).toHaveBeenCalledWith(
      'beforeDestroy',
      expect.toMatchDreamModel(dream),
      true,
      null,
      expect.any(DreamTransaction)
    )
    expect(hooksSpy).toHaveBeenCalledWith(
      'afterDestroy',
      expect.toMatchDreamModel(dream),
      true,
      null,
      expect.any(DreamTransaction)
    )
    expect(hooksSpy).toHaveBeenCalledWith(
      'afterDestroyCommit',
      expect.toMatchDreamModel(dream),
      true,
      null,
      expect.any(DreamTransaction)
    )
  }

  function expectNoDestroyHooksCalled(dream: Dream) {
    expect(hooksSpy).not.toHaveBeenCalledWith(
      'beforeDestroy',
      expect.toMatchDreamModel(dream),
      expect.toBeOneOf([expect.anything(), undefined, null]),
      expect.toBeOneOf([expect.anything(), undefined, null]),
      expect.toBeOneOf([expect.anything(), undefined, null])
    )
    expect(hooksSpy).not.toHaveBeenCalledWith(
      'afterDestroy',
      expect.toMatchDreamModel(dream),
      expect.toBeOneOf([expect.anything(), undefined, null]),
      expect.toBeOneOf([expect.anything(), undefined, null]),
      expect.toBeOneOf([expect.anything(), undefined, null])
    )
    expect(hooksSpy).not.toHaveBeenCalledWith(
      'afterDestroyCommit',
      expect.toMatchDreamModel(dream),
      expect.toBeOneOf([expect.anything(), undefined, null]),
      expect.toBeOneOf([expect.anything(), undefined, null]),
      expect.toBeOneOf([expect.anything(), undefined, null])
    )
  }

  function expectNoCascadeDestroying(dream: Dream) {
    expect(cascadeSpy).not.toHaveBeenCalledWith(
      expect.toMatchDreamModel(dream),
      expect.anything(),
      expect.anything()
    )
  }

  it('destroys all records matching the query', async () => {
    await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
    await User.create({ email: 'how@yadoin', name: 'howyadoin', password: 'hamz' })
    const user3 = await User.create({ email: 'fish@yadoin', name: 'cheese', password: 'hamz' })

    await User.where({ name: 'howyadoin' }).destroy()

    expect(await User.count()).toEqual(1)
    expect(await User.first()).toMatchDreamModel(user3)
  })

  context('model hooks', () => {
    it('calls model hooks', async () => {
      const pet = await Pet.create()

      hooksSpy = vi.spyOn(runHooksForModule, 'default')

      await Pet.query().destroy()

      expectDestroyHooksCalled(pet)
    })

    context('skipHooks is passed', () => {
      it('skips model hooks', async () => {
        const pet = await Pet.create()

        hooksSpy = vi.spyOn(runHooksForModule, 'default')

        await Pet.query().destroy({ skipHooks: true })

        expectNoDestroyHooksCalled(pet)
      })
    })

    context('with SoftDelete decorator', () => {
      it('calls model hooks', async () => {
        const pet = await Pet.create()

        hooksSpy = vi.spyOn(runHooksForModule, 'default')

        await Pet.query().destroy()

        expectDestroyHooksCalled(pet)
      })

      context('skipHooks is passed', () => {
        it('skips model hooks', async () => {
          const pet = await Pet.create()

          hooksSpy = vi.spyOn(runHooksForModule, 'default')

          await Pet.query().destroy({ skipHooks: true })

          expectNoDestroyHooksCalled(pet)
        })
      })
    })
  })

  context('with a HasMany association with dependent: "destroy"', () => {
    let user: User
    let post: Post
    let heartRating: HeartRating
    let rating: Rating

    beforeEach(async () => {
      user = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
      post = await Post.create({ user })
      heartRating = await post.createAssociation('heartRatings', { user, rating: 1 })
      rating = await post.createAssociation('ratings', { user, rating: 1 })

      expect(await Rating.count()).toEqual(1)
      expect(await HeartRating.count()).toEqual(1)

      hooksSpy = vi.spyOn(runHooksForModule, 'default')
    })

    it('cascade deletes all related HasMany associations, including deeply nested associations', async () => {
      expect(await User.count()).toEqual(1)
      expect(await Post.count()).toEqual(1)
      expect(await Rating.count()).toEqual(1)
      expect(await HeartRating.count()).toEqual(1)

      await User.query().destroy()

      expect(await User.count()).toEqual(0)
      expect(await Post.count()).toEqual(0)
      expect(await Rating.count()).toEqual(0)
      expect(await HeartRating.count()).toEqual(0)
    })

    context('with a SoftDelete model', () => {
      it('sets deletedAt to a datetime, does not delete record', async () => {
        expect(post.deletedAt).toBeNull()

        await post.destroy()

        expect(await Post.last()).toBeNull()
        const reloadedPost = await Post.removeAllDefaultScopes().last()
        expect(reloadedPost!.deletedAt).not.toBeNull()
      })

      it('cascade deletes all nested dependent-destroy associations on each associated model', async () => {
        const postVisibility = await PostVisibility.create()
        await post.createAssociation('postVisibility', postVisibility)

        expect(await PostVisibility.count()).toEqual(1)
        expect(await Post.count()).toEqual(1)
        expect(await Rating.count()).toEqual(1)
        expect(await HeartRating.count()).toEqual(1)

        await PostVisibility.query().destroy()

        expect(await PostVisibility.count()).toEqual(0)
        expect(await Post.count()).toEqual(0)
        expect(await Rating.count()).toEqual(0)
        expect(await HeartRating.count()).toEqual(0)
      })

      it('calls callbacks for associations', async () => {
        const composition = await Composition.create({ user })
        await user.destroy()
        expectDestroyHooksCalled(composition)
      })
    })

    context('when cascade delete is applied at the database level', () => {
      it('calls callbacks for associations', async () => {
        const composition = await Composition.create({ user })

        await User.query().destroy()

        expectDestroyHooksCalled(composition)
      })
    })

    context('when a deeply nested association fails to destroy', () => {
      beforeEach(() => {
        if (!Object.getOwnPropertyDescriptor(Rating, 'hooks')) Rating['hooks'] = blankHooksFactory(Rating)
        ;(Rating.prototype as any)['throwAnError'] = () => {
          throw new Error('howyadoin')
        }
        Rating['addHook']('afterDestroy', 'throwAnError' as any)
      })

      afterEach(() => {
        ;(Rating['hooks'].afterDestroy as HookStatement[]).pop()
      })

      it('prevents destruction of model', async () => {
        const postVisibility = await PostVisibility.create()
        await post.createAssociation('postVisibility', postVisibility)

        expect(await PostVisibility.count()).toEqual(1)
        expect(await Post.count()).toEqual(1)
        expect(await Rating.count()).toEqual(1)
        expect(await HeartRating.count()).toEqual(1)

        await expect(async () => {
          await PostVisibility.query().destroy()
        }).rejects.toThrow()

        expect(await PostVisibility.count()).toEqual(1)
        expect(await Post.count()).toEqual(1)
        expect(await Rating.count()).toEqual(1)
        expect(await HeartRating.count()).toEqual(1)
      })
    })

    it('calls model hooks on each destroyed association', async () => {
      await Post.query().destroy()
      expectDestroyHooksCalled(heartRating)
      expectDestroyHooksCalled(rating)
    })

    context('within a transaction', () => {
      it('applies the transaction to subsequent queries', async () => {
        try {
          await ApplicationModel.transaction(async txn => {
            await Post.query().txn(txn).destroy()
            throw new Error('breaking out of transaction')
          })
        } catch {
          // noop
        }

        expect(await Rating.count()).toEqual(1)
        expect(await HeartRating.count()).toEqual(1)
      })
    })

    context('skipHooks=true', () => {
      it('does not call model hooks', async () => {
        await Post.query().destroy({ skipHooks: true })

        expectNoDestroyHooksCalled(heartRating)
        expectNoDestroyHooksCalled(rating)
      })

      context('with dependent defined on one or more of this model’s associations', () => {
        it('the associated models are deleted', async () => {
          const postVisibility = await PostVisibility.create()
          await post.createAssociation('postVisibility', postVisibility)

          expect(await PostVisibility.count()).toEqual(1)
          expect(await Post.count()).toEqual(1)
          expect(await Rating.count()).toEqual(1)
          expect(await HeartRating.count()).toEqual(1)

          await PostVisibility.query().destroy({ skipHooks: true })

          expect(await PostVisibility.count()).toEqual(0)
          expect(await Post.count()).toEqual(0)
          expect(await Rating.count()).toEqual(0)
          expect(await HeartRating.count()).toEqual(0)
        })
      })

      context('with dependent defined only at the DB level', () => {
        it('the associated models are deleted', async () => {
          await Mylar.create({ user })

          expect(await User.count()).toEqual(1)
          expect(await Balloon.count()).toEqual(1)

          await User.query().destroy({ skipHooks: true })

          expect(await User.count()).toEqual(0)
          expect(await Balloon.count()).toEqual(0)
        })
      })
    })
  })

  context('with a HasOne association with dependent: "destroy"', () => {
    let composition: Composition
    let deletableLocalizedText: LocalizedText
    let nonDeletableLocalizedText: LocalizedText

    beforeEach(async () => {
      const user = await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
      composition = await Composition.create({ user })
      deletableLocalizedText = await composition.createAssociation('localizedTexts', {
        name: 'cascade delete me',
        locale: 'en-US',
      })
      nonDeletableLocalizedText = await composition.createAssociation('localizedTexts', {
        name: 'dont cascade delete me',
        locale: 'es-ES',
      })

      expect(await LocalizedText.count()).toEqual(2)

      hooksSpy = vi.spyOn(runHooksForModule, 'default')
    })

    it('cascade deletes all related HasOne associations', async () => {
      await Composition.query().destroy()
      expect(await LocalizedText.all()).toMatchDreamModels([nonDeletableLocalizedText])
    })

    it('calls model hooks on the destroyed association', async () => {
      await Composition.query().destroy()
      expectDestroyHooksCalled(deletableLocalizedText)
    })

    context('skipHooks=true', () => {
      it('does not call association model hooks', async () => {
        await Composition.query().destroy({ skipHooks: true })
        expectNoDestroyHooksCalled(deletableLocalizedText)
      })
    })
  })

  context('cascade is false (it is true by default)', () => {
    it('skips cascade-destroying associations', async () => {
      const pet = await Pet.create()

      cascadeSpy = vi.spyOn(destroyAssociatedRecordsModule, 'default')

      await Pet.query().destroy({ cascade: false })

      expectNoCascadeDestroying(pet)
    })
  })

  context('lock=true (guarded, compare-and-set destroy)', () => {
    // Interposes on the driver's `pluck` — the batch's unlocked candidate read —
    // so that a spec can run a concurrent writer in between that read and the
    // locked re-read, the exact window `lock: true` exists to close. `sabotage`
    // runs outside the destroy's transaction (no transaction is applied to it),
    // so it commits independently and is genuinely a competing writer.
    function interposeBetweenCandidateAndLockedReads(sabotage: () => Promise<void>) {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalPluck = KyselyQueryDriver.prototype.pluck
      let sabotaged = false

      return vi.spyOn(KyselyQueryDriver.prototype, 'pluck').mockImplementation(async function (
        this: KyselyQueryDriver<Pet>,
        ...fields: any[]
      ) {
        const results = await originalPluck.apply(this, fields)

        if (!sabotaged) {
          sabotaged = true
          await sabotage()
        }

        return results
      })
    }

    it('destroys the matching records and returns the number claimed', async () => {
      const aster = await Pet.create({ name: 'aster' })
      const violet = await Pet.create({ name: 'violet' })

      expect(await Pet.where({ name: 'aster' }).destroy({ lock: true })).toEqual(1)

      expect(await Pet.all()).toMatchDreamModels([violet])
      expect(await Pet.removeAllDefaultScopes().findOrFail(aster.id)).toMatchDreamModel(aster)
    })

    it('locks the rows it is about to destroy, scoped to the Query’s own table', async () => {
      await Pet.create({ name: 'aster' })
      const applyRowLockSpy = vi.spyOn(PostgresQueryDriver.prototype, 'applyRowLock')

      await Pet.where({ name: 'aster' }).destroy({ lock: true })

      expect(applyRowLockSpy).toHaveBeenCalledWith(expect.anything(), 'pets')
      expect(applyRowLockSpy.mock.results[0]!.value.compile().sql.toLowerCase()).toContain(
        'for update of "pets"'
      )
    })

    it('holds the row lock until the destroy transaction commits, blocking a competing writer', async () => {
      const aster = await Pet.create({ name: 'aster' })

      let competingWriteSettled = false
      const competingWrites: Promise<number>[] = []

      // interposes *after* the locked re-read, while the destroy's transaction
      // still holds the row lock. A competing writer on its own connection must
      // not be able to make progress until that transaction commits — this is
      // the only assertion in this file that a plain (unlocked) SELECT fails.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalTakeAll = KyselyQueryDriver.prototype.takeAll
      vi.spyOn(KyselyQueryDriver.prototype, 'takeAll').mockImplementation(async function (
        this: KyselyQueryDriver<Pet>,
        options = {}
      ) {
        const results = await originalTakeAll.call(this, options)

        if (options.lock && competingWrites.length === 0) {
          competingWrites.push(
            Pet.where({ id: aster.id })
              .update({ name: 'renamed' }, { skipHooks: true })
              .then(updatedCount => {
                competingWriteSettled = true
                return updatedCount
              })
          )

          await new Promise(resolve => setTimeout(resolve, 500))
          expect(competingWriteSettled).toBe(false)
        }

        return results
      })

      expect(await Pet.where({ name: 'aster' }).destroy({ lock: true })).toEqual(1)

      await Promise.all(competingWrites)
      expect(competingWrites).toHaveLength(1)
      expect(competingWriteSettled).toBe(true)
    }, 15000)

    context('when another transaction moves a record out of the Query first', () => {
      it('does not destroy that record, and does not count it', async () => {
        const aster = await Pet.create({ name: 'aster' })

        interposeBetweenCandidateAndLockedReads(async () => {
          await Pet.where({ id: aster.id }).update({ name: 'renamed' })
        })

        expect(await Pet.where({ name: 'aster' }).destroy({ lock: true })).toEqual(0)

        expect(await Pet.all()).toMatchDreamModels([await Pet.findOrFail(aster.id)])
      })

      it('still destroys the records it did claim', async () => {
        const aster = await Pet.create({ name: 'aster' })
        const asterling = await Pet.create({ name: 'aster' })

        interposeBetweenCandidateAndLockedReads(async () => {
          await Pet.where({ id: aster.id }).update({ name: 'renamed' })
        })

        expect(await Pet.where({ name: 'aster' }).destroy({ lock: true })).toEqual(1)

        expect(await Pet.all()).toMatchDreamModels([await Pet.findOrFail(aster.id)])
        expect(await Pet.removeAllDefaultScopes().findOrFail(asterling.id)).toMatchDreamModel(asterling)
      })
    })

    context('when the matching records span more than one batch', () => {
      it('destroys every one of them', async () => {
        for (let i = 0; i < 5; i++) await Pet.create({ name: 'aster' })
        const violet = await Pet.create({ name: 'violet' })

        expect(await Pet.where({ name: 'aster' }).destroy({ lock: true, batchSize: 2 })).toEqual(5)

        expect(await Pet.all()).toMatchDreamModels([violet])
      })

      it('takes a lock per batch rather than one for the whole run', async () => {
        for (let i = 0; i < 5; i++) await Pet.create({ name: 'aster' })
        const applyRowLockSpy = vi.spyOn(PostgresQueryDriver.prototype, 'applyRowLock')

        await Pet.where({ name: 'aster' }).destroy({ lock: true, batchSize: 2 })

        // batches of 2, 2 and 1
        expect(applyRowLockSpy).toHaveBeenCalledTimes(3)
      })
    })

    context('reallyDestroy', () => {
      it('permanently removes the claimed records', async () => {
        const aster = await Pet.create({ name: 'aster' })

        expect(await Pet.where({ name: 'aster' }).reallyDestroy({ lock: true })).toEqual(1)

        expect(await Pet.removeAllDefaultScopes().find(aster.id)).toBeNull()
      })
    })

    it('does not hydrate and preload each batch’s records twice', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      await Pet.create({ user, name: 'aster' })
      const applyPreloadSpy = vi.spyOn(KyselyQueryDriver.prototype as any, 'applyPreload')

      await Pet.preload('user').where({ name: 'aster' }).destroy({ lock: true })

      // the batch's candidate read plucks primary keys only, so the Query's own
      // preload tree runs exactly once per batch — for the locked re-read
      const preloadsOfThisQueryTree = applyPreloadSpy.mock.calls.filter(call =>
        Object.keys((call[0] ?? {}) as Record<string, unknown>).includes('user')
      )
      expect(preloadsOfThisQueryTree).toHaveLength(1)
    })

    context('when the Query already carries a transaction', () => {
      it('shares the caller’s transaction across every batch, so a rollback undoes the whole run', async () => {
        for (let i = 0; i < 5; i++) await Pet.create({ name: 'aster' })

        await expect(
          ApplicationModel.transaction(async txn => {
            const count = await Pet.query()
              .txn(txn)
              .where({ name: 'aster' })
              .destroy({ lock: true, batchSize: 2 })

            expect(count).toEqual(5)
            expect(await Pet.query().txn(txn).where({ name: 'aster' }).count()).toEqual(0)

            throw new Error('breaking out of transaction')
          })
        ).rejects.toThrow('breaking out of transaction')

        expect(await Pet.where({ name: 'aster' }).count()).toEqual(5)
      })

      it('opens no transaction of its own', async () => {
        for (let i = 0; i < 5; i++) await Pet.create({ name: 'aster' })
        const transactionSpy = vi.spyOn(ApplicationModel, 'transaction')

        await ApplicationModel.transaction(async txn => {
          await Pet.query().txn(txn).where({ name: 'aster' }).destroy({ lock: true, batchSize: 2 })
        })

        // only the caller's own transaction, none per batch
        expect(transactionSpy).toHaveBeenCalledTimes(1)
      })
    })

    context('when the last record in a batch has a primary key of 0', () => {
      beforeEach(() => {
        if (!Object.getOwnPropertyDescriptor(ModelWithSerialPrimaryKey, 'hooks'))
          ModelWithSerialPrimaryKey['hooks'] = blankHooksFactory(ModelWithSerialPrimaryKey)
        ;(ModelWithSerialPrimaryKey.prototype as any)['preventItsOwnDeletion'] = function (this: Dream) {
          this.preventDeletion()
        }
        ModelWithSerialPrimaryKey['addHook']('beforeDestroy', {
          type: 'beforeDestroy',
          className: 'ModelWithSerialPrimaryKey',
          method: 'preventItsOwnDeletion',
        })
      })

      afterEach(() => {
        ;(ModelWithSerialPrimaryKey['hooks'].beforeDestroy as HookStatement[]).pop()
      })

      it('advances the keyset cursor past it rather than re-reading the same batch forever', async () => {
        // a record whose beforeDestroy prevents its own deletion stays in the
        // Query, so a cursor that treats a primary key of 0 as "no cursor" reads
        // it again on every pass and never terminates
        await ModelWithSerialPrimaryKey.create({ id: 0 } as any)

        expect(await ModelWithSerialPrimaryKey.query().destroy({ lock: true, batchSize: 1 })).toEqual(1)

        expect(await ModelWithSerialPrimaryKey.count()).toEqual(1)
      })
    })

    context('when the Query also calls distinct', () => {
      it('fails loudly rather than emitting FOR UPDATE alongside DISTINCT ON, which the database rejects', async () => {
        await Pet.create({ name: 'aster' })
        const applyRowLockSpy = vi.spyOn(PostgresQueryDriver.prototype, 'applyRowLock')

        await expect(Pet.where({ name: 'aster' }).distinct().destroy({ lock: true })).rejects.toThrow(
          RowLockIncompatibleWithDistinct
        )

        // the guard fires before any transaction is opened or any row is read
        expect(applyRowLockSpy).not.toHaveBeenCalled()
        expect(await Pet.where({ name: 'aster' }).count()).toEqual(1)
      })
    })

    context('when the option is not passed', () => {
      it('takes no lock', async () => {
        await Pet.create({ name: 'aster' })
        const applyRowLockSpy = vi.spyOn(PostgresQueryDriver.prototype, 'applyRowLock')

        expect(await Pet.where({ name: 'aster' }).destroy()).toEqual(1)

        expect(applyRowLockSpy).not.toHaveBeenCalled()
      })
    })
  })

  context('batchSize', () => {
    it('rejects 0, which would otherwise mean "no limit" and destroy the whole set in one batch', async () => {
      await Pet.create({ name: 'aster' })

      await expect(Pet.where({ name: 'aster' }).destroy({ batchSize: 0 })).rejects.toThrow(InvalidBatchSize)

      expect(await Pet.where({ name: 'aster' }).count()).toEqual(1)
    })

    it('rejects 0 on the locked path, which would otherwise lock the whole set', async () => {
      await Pet.create({ name: 'aster' })
      const applyRowLockSpy = vi.spyOn(PostgresQueryDriver.prototype, 'applyRowLock')

      await expect(Pet.where({ name: 'aster' }).destroy({ lock: true, batchSize: 0 })).rejects.toThrow(
        InvalidBatchSize
      )

      expect(applyRowLockSpy).not.toHaveBeenCalled()
      expect(await Pet.where({ name: 'aster' }).count()).toEqual(1)
    })

    it('rejects a negative batchSize', async () => {
      await expect(Pet.query().destroy({ lock: true, batchSize: -1 })).rejects.toThrow(InvalidBatchSize)
    })

    it('rejects a fractional batchSize', async () => {
      await expect(Pet.query().destroy({ lock: true, batchSize: 1.5 })).rejects.toThrow(InvalidBatchSize)
    })

    it('rejects an invalid batchSize passed to reallyDestroy', async () => {
      await expect(Pet.query().reallyDestroy({ batchSize: 0 })).rejects.toThrow(InvalidBatchSize)
    })
  })

  context('regarding connections', () => {
    let spy: MockInstance

    beforeEach(async () => {
      await User.create({ email: 'fred@fred', password: 'howyadoin' })

      spy = vi.spyOn(DreamDbConnection, 'getConnection')
    })

    it('uses primary connection', async () => {
      await User.where({ email: 'fred@fred' }).destroy()

      expect(spy).toHaveBeenCalledWith('default', 'primary', expect.anything())
    })

    context('with replica connection specified', () => {
      @ReplicaSafe()
      class CustomUser extends User {}

      it('uses the primary connection', async () => {
        await CustomUser.where({ email: 'fred@fred' }).destroy()

        // should always call to primary for update, regardless of replica-safe status
        expect(spy).toHaveBeenCalledWith('default', 'primary', expect.anything())
      })
    })
  })
})
