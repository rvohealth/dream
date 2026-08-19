import { MockInstance } from 'vitest'
import DreamDbConnection from '../../../src/db/DreamDbConnection.js'
import ReplicaSafe from '../../../src/decorators/class/ReplicaSafe.js'
import KyselyQueryDriver from '../../../src/dream/QueryDriver/Kysely.js'
import PostgresQueryDriver from '../../../src/dream/QueryDriver/Postgres.js'
import BatchingIncompatibleWithLimitOrOffset from '../../../src/errors/BatchingIncompatibleWithLimitOrOffset.js'
import DoNotSetEncryptedFieldsDirectly from '../../../src/errors/DoNotSetEncryptedFieldsDirectly.js'
import CannotSetEncryptedColumnInQueryUpdate from '../../../src/errors/encrypt/CannotSetEncryptedColumnInQueryUpdate.js'
import InvalidBatchSize from '../../../src/errors/InvalidBatchSize.js'
import MissingRequiredLockOptionForUpdateCallback from '../../../src/errors/MissingRequiredLockOptionForUpdateCallback.js'
import NoUpdateAllOnJoins from '../../../src/errors/NoUpdateAllOnJoins.js'
import NoUpdateOnAssociationQuery from '../../../src/errors/NoUpdateOnAssociationQuery.js'
import RowLockIncompatibleWithDistinct from '../../../src/errors/RowLockIncompatibleWithDistinct.js'
import ops from '../../../src/ops/index.js'
import { UpdateableProperties } from '../../../src/types/dream.js'
import ModelWithSerialPrimaryKey from '../../../test-app/app/models/ModelWithSerialPrimaryKey.js'
import Pet from '../../../test-app/app/models/Pet.js'
import User from '../../../test-app/app/models/User.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'

describe('Query#update', () => {
  // Interposes on the driver's `pluck` — the batch's unlocked candidate read —
  // so that a spec can run a concurrent writer in between that read and the
  // locked re-read, the exact window `lock: true` exists to close. `sabotage`
  // runs outside the update's transaction (no transaction is applied to it),
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

  it('takes passed params and sends them through to all models matchin query', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const numRecords = await User.query().update({
      name: 'cool',
    })
    expect(numRecords).toEqual(2)
    const records = await User.all()
    expect(records.map(r => r.name)).toMatchObject(['cool', 'cool'])
  })

  it('respects where clause', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const numRecords = await User.query().where({ email: 'how@yadoin' }).update({
      name: 'cool',
    })
    expect(numRecords).toEqual(1)

    await user1.reload()
    await user2.reload()

    expect(user1.name).toBeNull()
    expect(user2.name).toEqual('cool')
  })

  it('calls model hooks', async () => {
    await Pet.create()
    await Pet.query().update({ name: 'change me' })
    const pet = await Pet.first()
    expect(pet!.name).toEqual('changed by update hook')
  })

  context('skipHooks is passed', () => {
    it('skips model hooks', async () => {
      await Pet.create()
      await Pet.query().update({ name: 'change me' }, { skipHooks: true })
      const pet = await Pet.first()
      expect(pet!.name).toEqual('change me')
    })

    context('with an @Encrypted backing column', () => {
      it('permits null, clearing the column', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', secret: 'original' })

        const count = await User.where({ id: user.id }).update({ encryptedSecret: null }, { skipHooks: true })
        expect(count).toEqual(1)

        await user.reload()
        expect(user.getAttribute('encryptedSecret')).toBeNull()
        expect(user.secret).toBeNull()
      })

      it('permits a plain column alongside a cleared encrypted column', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', secret: 'original' })

        await User.where({ id: user.id }).update(
          { name: 'Chalupa Joe', encryptedSecret: null },
          { skipHooks: true }
        )

        await user.reload()
        expect(user.name).toEqual('Chalupa Joe')
        expect(user.getAttribute('encryptedSecret')).toBeNull()
      })

      it('rejects a non-null value, leaving the row unchanged', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', secret: 'original' })
        const originalCiphertext = user.getAttribute('encryptedSecret')

        await expect(
          User.where({ id: user.id }).update({ encryptedSecret: 'plaintext' }, { skipHooks: true })
        ).rejects.toThrow(CannotSetEncryptedColumnInQueryUpdate)

        await user.reload()
        expect(user.getAttribute('encryptedSecret')).toEqual(originalCiphertext)
        expect(user.secret).toEqual('original')
      })

      it('rejects undefined, which is not a request to clear the column', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', secret: 'original' })

        await expect(
          User.where({ id: user.id }).update({ encryptedSecret: undefined }, { skipHooks: true })
        ).rejects.toThrow(CannotSetEncryptedColumnInQueryUpdate)

        await user.reload()
        expect(user.secret).toEqual('original')
      })

      it('rejects a non-null value written to a custom-named backing column', async () => {
        const user = await User.create({
          email: 'fred@frewd',
          password: 'howyadoin',
          otherSecret: { token: 'original' },
        })
        const originalCiphertext = user.getAttribute('myOtherEncryptedSecret')

        await expect(
          User.where({ id: user.id }).update({ myOtherEncryptedSecret: 'plaintext' }, { skipHooks: true })
        ).rejects.toThrow(CannotSetEncryptedColumnInQueryUpdate)

        await user.reload()
        expect(user.getAttribute('myOtherEncryptedSecret')).toEqual(originalCiphertext)
        expect(user.otherSecret).toEqual({ token: 'original' })
      })

      it('does not type check the plaintext property, which is not part of the table schema', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', secret: 'original' })

        await expect(
          // @ts-expect-error the no-lock skipHooks form is typed as the raw table
          // schema, which has no virtual columns
          User.where({ id: user.id }).update({ secret: 'updated' }, { skipHooks: true })
        ).rejects.toThrow()
      })
    })
  })

  context('with a virtual column', () => {
    it('routes the value through model hooks', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const originalDigest = user.passwordDigest

      await User.query().update({ password: 'differentpassword' })

      await user.reload()
      expect(user.passwordDigest).toBeTruthy()
      expect(user.passwordDigest).not.toEqual(originalDigest)
    })
  })

  context('with an encrypted column', () => {
    it('encrypts the value before persisting it', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', secret: 'original' })

      await User.query().update({ secret: 'updated secret' })

      await user.reload()
      expect(user.secret).toEqual('updated secret')
      expect(user.getAttribute('encryptedSecret')).not.toEqual('updated secret')
    })
  })

  context('within an associationQuery', () => {
    it('raises an exception', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      await user.createAssociation('compositions', { content: 'Opus' })

      await expect(user.associationQuery('compositions').update({ content: 'cool' })).rejects.toThrow(
        NoUpdateOnAssociationQuery
      )
    })
  })

  context('with joins', () => {
    it('raises an exception', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      await user.createAssociation('compositions', { content: 'Opus' })

      await expect(User.innerJoin('compositions').update({ name: 'cool' })).rejects.toThrow(
        NoUpdateAllOnJoins
      )
    })
  })

  context('with a similarity search applied', () => {
    it('respects a single similarity statement', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'calvin' })

      const numRecords = await User.query()
        .where({ name: ops.similarity('fres') })
        .update({
          name: 'cool',
        })
      expect(numRecords).toEqual(1)

      await user1.reload()
      await user2.reload()

      expect(user1.name).toEqual('cool')
      expect(user2.name).toEqual('calvin')
    })

    it('respects multiple similarity statements', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'calvin' })

      const numRecords = await User.query()
        .where({ name: ops.similarity('fres'), email: ops.similarity('fred@fred') })
        .update({
          name: 'cool',
        })
      expect(numRecords).toEqual(1)

      await user1.reload()
      await user2.reload()

      expect(user1.name).toEqual('cool')
      expect(user2.name).toEqual('calvin')
    })
  })

  context('lock=true (guarded, compare-and-set update)', () => {
    it('updates the matching records and returns the number claimed', async () => {
      const aster = await Pet.create({ name: 'aster' })
      const violet = await Pet.create({ name: 'violet' })

      expect(await Pet.where({ name: 'aster' }).update({ name: 'winner' }, { lock: true })).toEqual(1)

      expect((await Pet.findOrFail(aster.id)).name).toEqual('winner')
      expect((await Pet.findOrFail(violet.id)).name).toEqual('violet')
    })

    it('locks the rows it is about to update, scoped to the Query’s own table', async () => {
      await Pet.create({ name: 'aster' })
      const applyRowLockSpy = vi.spyOn(PostgresQueryDriver.prototype, 'applyRowLock')

      await Pet.where({ name: 'aster' }).update({ name: 'winner' }, { lock: true })

      expect(applyRowLockSpy).toHaveBeenCalledWith(expect.anything(), 'pets')
      expect(applyRowLockSpy.mock.results[0]!.value.compile().sql.toLowerCase()).toContain(
        'for update of "pets"'
      )
    })

    it('holds the row lock until the update transaction commits, blocking a competing writer', async () => {
      const aster = await Pet.create({ name: 'aster' })

      let competingWriteSettled = false
      const competingWrites: Promise<number>[] = []

      // interposes *after* the locked re-read, while the update's transaction
      // still holds the row lock. A competing writer on its own connection must
      // not be able to make progress until that transaction commits.
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

      expect(await Pet.where({ name: 'aster' }).update({ name: 'winner' }, { lock: true })).toEqual(1)

      await Promise.all(competingWrites)
      expect(competingWrites).toHaveLength(1)
      expect(competingWriteSettled).toBe(true)
    }, 15000)

    it('respects a similarity statement in the locked re-read', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'calvin' })

      expect(
        await User.query()
          .where({ name: ops.similarity('fres') })
          .update({ name: 'cool' }, { lock: true })
      ).toEqual(1)

      await user1.reload()
      await user2.reload()
      expect(user1.name).toEqual('cool')
      expect(user2.name).toEqual('calvin')
    })

    context('when another transaction moves a record out of the Query first', () => {
      it('does not update that record, and does not count it', async () => {
        const aster = await Pet.create({ name: 'aster' })

        interposeBetweenCandidateAndLockedReads(async () => {
          await Pet.where({ id: aster.id }).update({ name: 'renamed' })
        })

        expect(await Pet.where({ name: 'aster' }).update({ name: 'winner' }, { lock: true })).toEqual(0)

        expect((await Pet.findOrFail(aster.id)).name).toEqual('renamed')
      })

      it('still updates the records it did claim', async () => {
        const aster = await Pet.create({ name: 'aster' })
        const asterling = await Pet.create({ name: 'aster' })

        interposeBetweenCandidateAndLockedReads(async () => {
          await Pet.where({ id: aster.id }).update({ name: 'renamed' })
        })

        expect(await Pet.where({ name: 'aster' }).update({ name: 'winner' }, { lock: true })).toEqual(1)

        expect((await Pet.findOrFail(aster.id)).name).toEqual('renamed')
        expect((await Pet.findOrFail(asterling.id)).name).toEqual('winner')
      })

      context('when every record in a mid-run batch loses the race', () => {
        it('advances past the lost batch instead of ending the run early', async () => {
          const lost = await Pet.create({ name: 'aster' })
          const second = await Pet.create({ name: 'aster' })
          const third = await Pet.create({ name: 'aster' })

          // batchSize 1 makes the lost record the entire first batch; an
          // implementation deriving the cursor or the continue-condition from
          // the *claimed* records (instead of the candidate pluck) would see an
          // empty batch and end the run, silently skipping every record after it
          interposeBetweenCandidateAndLockedReads(async () => {
            await Pet.where({ id: lost.id }).update({ name: 'renamed' })
          })

          expect(
            await Pet.where({ name: 'aster' }).update({ name: 'winner' }, { lock: true, batchSize: 1 })
          ).toEqual(2)

          expect((await Pet.findOrFail(lost.id)).name).toEqual('renamed')
          expect((await Pet.findOrFail(second.id)).name).toEqual('winner')
          expect((await Pet.findOrFail(third.id)).name).toEqual('winner')
        })
      })
    })

    context('when the matching records span more than one batch', () => {
      it('updates every one of them', async () => {
        for (let i = 0; i < 5; i++) await Pet.create({ name: 'aster' })
        const violet = await Pet.create({ name: 'violet' })

        expect(
          await Pet.where({ name: 'aster' }).update({ name: 'winner' }, { lock: true, batchSize: 2 })
        ).toEqual(5)

        expect(await Pet.where({ name: 'winner' }).count()).toEqual(5)
        expect((await Pet.findOrFail(violet.id)).name).toEqual('violet')
      })

      it('takes a lock per batch rather than one for the whole run', async () => {
        for (let i = 0; i < 5; i++) await Pet.create({ name: 'aster' })
        const applyRowLockSpy = vi.spyOn(PostgresQueryDriver.prototype, 'applyRowLock')

        await Pet.where({ name: 'aster' }).update({ name: 'winner' }, { lock: true, batchSize: 2 })

        // batches of 2, 2 and 1
        expect(applyRowLockSpy).toHaveBeenCalledTimes(3)
      })
    })

    context('when the Query carries preloads', () => {
      it('does not run them under the lock for the attributes form, which never consumes them', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await user.createAssociation('compositions', { content: 'Opus' })
        const applyOnePreloadSpy = vi.spyOn(KyselyQueryDriver.prototype as any, 'applyOnePreload')

        await User.query().preload('compositions').update({ name: 'cool' }, { lock: true })

        expect(applyOnePreloadSpy).not.toHaveBeenCalled()
        expect((await User.firstOrFail()).name).toEqual('cool')
      })

      it('keeps them for the callback form, whose callback may consume them', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await user.createAssociation('compositions', { content: 'Opus' })

        const count = await User.query()
          .preload('compositions')
          .update(u => ({ name: `has ${u.compositions.length} compositions` }), { lock: true })

        expect(count).toEqual(1)
        expect((await User.firstOrFail()).name).toEqual('has 1 compositions')
      })
    })

    context('model hooks', () => {
      it('calls model hooks on each claimed record', async () => {
        await Pet.create()

        await Pet.query().update({ name: 'change me' }, { lock: true })

        const pet = await Pet.first()
        expect(pet!.name).toEqual('changed by update hook')
      })

      it('routes virtual columns through model hooks', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const originalDigest = user.passwordDigest

        await User.query().update({ password: 'differentpassword' }, { lock: true })

        await user.reload()
        expect(user.passwordDigest).toBeTruthy()
        expect(user.passwordDigest).not.toEqual(originalDigest)
      })

      context('skipHooks is passed', () => {
        it('skips model hooks', async () => {
          await Pet.create()

          await Pet.query().update({ name: 'change me' }, { lock: true, skipHooks: true })

          const pet = await Pet.first()
          expect(pet!.name).toEqual('change me')
        })

        it('still runs custom setters, unlike the no-lock skipHooks fast path', async () => {
          const withLock = await Pet.create({ name: 'aster' })

          await Pet.where({ id: withLock.id }).update({ nickname: 'Pony' }, { lock: true, skipHooks: true })
          expect((await Pet.findOrFail(withLock.id)).getAttribute('nickname')).toEqual('Li’l Pony')

          // the no-lock skipHooks form is a single raw UPDATE ... WHERE, which
          // writes the column directly, bypassing the custom setter
          await Pet.where({ id: withLock.id }).update({ nickname: 'Pony' }, { skipHooks: true })
          expect((await Pet.findOrFail(withLock.id)).getAttribute('nickname')).toEqual('Pony')
        })

        it('still encrypts encrypted columns, whose preprocessing lives in their setter', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', secret: 'original' })

          await User.query().update({ secret: 'updated secret' }, { lock: true, skipHooks: true })

          await user.reload()
          expect(user.secret).toEqual('updated secret')
          expect(user.getAttribute('encryptedSecret')).not.toEqual('updated secret')
        })

        it('rejects the backing column with the setter error, not the query-update error', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', secret: 'original' })

          await expect(
            User.where({ id: user.id }).update(
              { encryptedSecret: 'plaintext' } as unknown as UpdateableProperties<User>,
              { lock: true, skipHooks: true }
            )
          ).rejects.toThrow(DoNotSetEncryptedFieldsDirectly)

          await user.reload()
          expect(user.secret).toEqual('original')
        })
      })
    })

    context('count semantics', () => {
      it('counts a claimed record even when the attributes already match (a no-op write)', async () => {
        await Pet.create({ name: 'aster' })

        expect(await Pet.where({ name: 'aster' }).update({ name: 'aster' }, { lock: true })).toEqual(1)
      })

      it('counts claimed records even when passed an empty attributes object', async () => {
        await Pet.create({ name: 'aster' })

        expect(await Pet.where({ name: 'aster' }).update({}, { lock: true })).toEqual(1)
      })
    })

    context('when the Query already carries a transaction', () => {
      it('shares the caller’s transaction across every batch, so a rollback undoes the whole run', async () => {
        for (let i = 0; i < 5; i++) await Pet.create({ name: 'aster' })

        await expect(
          ApplicationModel.transaction(async txn => {
            const count = await Pet.query()
              .txn(txn)
              .where({ name: 'aster' })
              .update({ name: 'winner' }, { lock: true, batchSize: 2 })

            expect(count).toEqual(5)
            expect(await Pet.query().txn(txn).where({ name: 'winner' }).count()).toEqual(5)

            throw new Error('breaking out of transaction')
          })
        ).rejects.toThrow('breaking out of transaction')

        expect(await Pet.where({ name: 'aster' }).count()).toEqual(5)
        expect(await Pet.where({ name: 'winner' }).count()).toEqual(0)
      })

      it('opens no transaction of its own', async () => {
        for (let i = 0; i < 5; i++) await Pet.create({ name: 'aster' })
        const transactionSpy = vi.spyOn(ApplicationModel, 'transaction')

        await ApplicationModel.transaction(async txn => {
          await Pet.query()
            .txn(txn)
            .where({ name: 'aster' })
            .update({ name: 'winner' }, { lock: true, batchSize: 2 })
        })

        // only the caller's own transaction, none per batch
        expect(transactionSpy).toHaveBeenCalledTimes(1)
      })
    })

    context('when the last record in a batch has a primary key of 0', () => {
      it('advances the keyset cursor past it rather than re-reading the same batch forever', async () => {
        // an updated record still matches this Query, so a cursor that treats a
        // primary key of 0 as "no cursor" reads it again on every pass and
        // never terminates
        await ModelWithSerialPrimaryKey.create({ id: 0 } as any)

        expect(await ModelWithSerialPrimaryKey.query().update({}, { lock: true, batchSize: 1 })).toEqual(1)
      })
    })

    context('when the Query also calls distinct', () => {
      it('fails loudly rather than emitting FOR UPDATE alongside DISTINCT ON, which the database rejects', async () => {
        await Pet.create({ name: 'aster' })
        const applyRowLockSpy = vi.spyOn(PostgresQueryDriver.prototype, 'applyRowLock')

        await expect(
          Pet.where({ name: 'aster' }).distinct().update({ name: 'winner' }, { lock: true })
        ).rejects.toThrow(RowLockIncompatibleWithDistinct)

        // the guard fires before any transaction is opened or any row is read
        expect(applyRowLockSpy).not.toHaveBeenCalled()
        expect(await Pet.where({ name: 'aster' }).count()).toEqual(1)
      })
    })

    context('with leftJoinPreload', () => {
      it('throws NoUpdateAllOnJoins, update’s pre-existing joins guard, before any lock path runs', async () => {
        const applyRowLockSpy = vi.spyOn(PostgresQueryDriver.prototype, 'applyRowLock')

        await expect(
          User.leftJoinPreload('compositions').update({ name: 'cool' }, { lock: true })
        ).rejects.toThrow(NoUpdateAllOnJoins)

        expect(applyRowLockSpy).not.toHaveBeenCalled()
      })
    })

    context('when the option is not passed', () => {
      it('takes no lock', async () => {
        await Pet.create({ name: 'aster' })
        const applyRowLockSpy = vi.spyOn(PostgresQueryDriver.prototype, 'applyRowLock')

        expect(await Pet.where({ name: 'aster' }).update({ name: 'winner' })).toEqual(1)

        expect(applyRowLockSpy).not.toHaveBeenCalled()
      })
    })
  })

  context('with a callback first argument', () => {
    context('lock: true', () => {
      it('writes the attributes the callback returns for each claimed record', async () => {
        const aster = await Pet.create({ name: 'aster' })
        const violet = await Pet.create({ name: 'violet' })

        const count = await Pet.query().update(pet => ({ name: `${pet.name} updated` }), { lock: true })

        expect(count).toEqual(2)
        expect((await Pet.findOrFail(aster.id)).name).toEqual('aster updated')
        expect((await Pet.findOrFail(violet.id)).name).toEqual('violet updated')
      })

      it('accepts an async callback', async () => {
        await Pet.create({ name: 'aster' })

        const count = await Pet.where({ name: 'aster' }).update(
          async pet => {
            await new Promise(resolve => setTimeout(resolve, 1))
            return { name: `${pet.name} async` }
          },
          { lock: true }
        )

        expect(count).toEqual(1)
        expect(await Pet.where({ name: 'aster async' }).count()).toEqual(1)
      })

      it('skips records the callback returns undefined for, and does not count them', async () => {
        const aster = await Pet.create({ name: 'aster' })
        const violet = await Pet.create({ name: 'violet' })

        const count = await Pet.query().update(
          pet => (pet.name === 'aster' ? { name: 'winner' } : undefined),
          { lock: true }
        )

        expect(count).toEqual(1)
        expect((await Pet.findOrFail(aster.id)).name).toEqual('winner')
        expect((await Pet.findOrFail(violet.id)).name).toEqual('violet')
      })

      it('treats a null callback return as a skip rather than crashing', async () => {
        await Pet.create({ name: 'aster' })

        const count = await Pet.query().update((() => null) as any, { lock: true })

        expect(count).toEqual(0)
        expect(await Pet.where({ name: 'aster' }).count()).toEqual(1)
      })

      it('discards mutations made directly on the received record, writing only the returned attributes', async () => {
        const aster = await Pet.create({ name: 'aster', species: 'dog' })

        const count = await Pet.query().update(
          pet => {
            pet.name = 'mutated'
            return { species: 'cat' }
          },
          { lock: true }
        )

        expect(count).toEqual(1)
        const reloaded = await Pet.findOrFail(aster.id)
        expect(reloaded.name).toEqual('aster')
        expect(reloaded.species).toEqual('cat')
      })

      it('rolls back the whole batch when the callback throws mid-batch', async () => {
        const first = await Pet.create({ name: 'aster' })
        await Pet.create({ name: 'aster' })

        await expect(
          Pet.where({ name: 'aster' }).update(
            pet => {
              if (pet.id === first.id) return { name: 'winner' }
              throw new Error('boom')
            },
            { lock: true }
          )
        ).rejects.toThrow('boom')

        // both records were in the same batch, so the write already made for
        // `first` rolls back along with it
        expect((await Pet.findOrFail(first.id)).name).toEqual('aster')
        expect(await Pet.where({ name: 'aster' }).count()).toEqual(2)
      })

      it('hands the callback the freshly locked read, not a stale pre-lock snapshot', async () => {
        const aster = await Pet.create({ name: 'aster', species: 'dog' })

        // a competing writer commits between candidate selection and the
        // locked re-read; its write keeps the record inside the Query, so the
        // record is still claimed, and the callback must see the committed
        // value rather than what the record held before the lock was taken
        interposeBetweenCandidateAndLockedReads(async () => {
          await Pet.where({ id: aster.id }).update({ species: 'cat' })
        })

        const seenSpecies: (string | null)[] = []
        const count = await Pet.where({ name: 'aster' }).update(
          pet => {
            seenSpecies.push(pet.species)
            return { name: 'winner' }
          },
          { lock: true }
        )

        expect(count).toEqual(1)
        expect(seenSpecies).toEqual(['cat'])
      })

      it('never invokes the callback for a record that lost the race, and does not count it', async () => {
        const aster = await Pet.create({ name: 'aster' })

        interposeBetweenCandidateAndLockedReads(async () => {
          await Pet.where({ id: aster.id }).update({ name: 'renamed' })
        })

        const cb = vi.fn(() => ({ name: 'winner' }))
        expect(await Pet.where({ name: 'aster' }).update(cb, { lock: true })).toEqual(0)

        expect(cb).not.toHaveBeenCalled()
        expect((await Pet.findOrFail(aster.id)).name).toEqual('renamed')
      })

      it('supports compare-then-write on an encrypted column, which no WHERE clause can express', async () => {
        const matching = await User.create({ email: 'fred@frewd', password: 'howyadoin', secret: 'expected' })
        const other = await User.create({ email: 'how@yadoin', password: 'howyadoin', secret: 'different' })

        const count = await User.query().update(
          user => (user.secret === 'expected' ? { secret: 'rotated' } : undefined),
          { lock: true }
        )

        expect(count).toEqual(1)
        await matching.reload()
        await other.reload()
        expect(matching.secret).toEqual('rotated')
        expect(matching.getAttribute('encryptedSecret')).not.toEqual('rotated')
        expect(other.secret).toEqual('different')
      })

      it('counts a record the callback chose to write even when the write is a no-op', async () => {
        await Pet.create({ name: 'aster' })

        expect(await Pet.where({ name: 'aster' }).update(() => ({ name: 'aster' }), { lock: true })).toEqual(
          1
        )
      })

      it('calls model hooks on each written record', async () => {
        await Pet.create()

        await Pet.query().update(() => ({ name: 'change me' }), { lock: true })

        const pet = await Pet.first()
        expect(pet!.name).toEqual('changed by update hook')
      })

      context('skipHooks is passed', () => {
        it('skips model hooks on each written record', async () => {
          await Pet.create()

          await Pet.query().update(() => ({ name: 'change me' }), { lock: true, skipHooks: true })

          const pet = await Pet.first()
          expect(pet!.name).toEqual('change me')
        })
      })

      context('when the Query already carries a transaction', () => {
        it('runs the callback’s writes inside the caller’s transaction, so a rollback undoes them', async () => {
          await Pet.create({ name: 'aster' })

          await expect(
            ApplicationModel.transaction(async txn => {
              const count = await Pet.query()
                .txn(txn)
                .where({ name: 'aster' })
                .update(() => ({ name: 'winner' }), { lock: true })

              expect(count).toEqual(1)
              expect(await Pet.query().txn(txn).where({ name: 'winner' }).count()).toEqual(1)

              throw new Error('breaking out of transaction')
            })
          ).rejects.toThrow('breaking out of transaction')

          expect(await Pet.where({ name: 'aster' }).count()).toEqual(1)
          expect(await Pet.where({ name: 'winner' }).count()).toEqual(0)
        })
      })

      context('batchSize', () => {
        it('rejects 0, which would otherwise lock the whole set', async () => {
          await expect(
            Pet.query().update(() => ({ name: 'winner' }), { lock: true, batchSize: 0 })
          ).rejects.toThrow(InvalidBatchSize)
        })
      })
    })

    context('lock: false (unlocked per-record derived update)', () => {
      it('writes what the callback returns for each record, taking no row locks', async () => {
        const aster = await Pet.create({ name: 'aster' })
        const violet = await Pet.create({ name: 'violet' })
        const applyRowLockSpy = vi.spyOn(PostgresQueryDriver.prototype, 'applyRowLock')

        const count = await Pet.query().update(pet => ({ name: `${pet.name} updated` }), { lock: false })

        expect(count).toEqual(2)
        expect(applyRowLockSpy).not.toHaveBeenCalled()
        expect((await Pet.findOrFail(aster.id)).name).toEqual('aster updated')
        expect((await Pet.findOrFail(violet.id)).name).toEqual('violet updated')
      })

      it('skips records the callback returns undefined for, and does not count them', async () => {
        const aster = await Pet.create({ name: 'aster' })
        const violet = await Pet.create({ name: 'violet' })

        const count = await Pet.query().update(
          pet => (pet.name === 'aster' ? { name: 'winner' } : undefined),
          { lock: false }
        )

        expect(count).toEqual(1)
        expect((await Pet.findOrFail(aster.id)).name).toEqual('winner')
        expect((await Pet.findOrFail(violet.id)).name).toEqual('violet')
      })

      it('treats a null callback return as a skip rather than crashing', async () => {
        await Pet.create({ name: 'aster' })

        const count = await Pet.query().update((() => null) as any, { lock: false })

        expect(count).toEqual(0)
        expect(await Pet.where({ name: 'aster' }).count()).toEqual(1)
      })

      it('discards mutations made directly on the received record, writing only the returned attributes', async () => {
        const aster = await Pet.create({ name: 'aster', species: 'dog' })

        const count = await Pet.query().update(
          pet => {
            pet.name = 'mutated'
            return { species: 'cat' }
          },
          { lock: false }
        )

        expect(count).toEqual(1)
        const reloaded = await Pet.findOrFail(aster.id)
        expect(reloaded.name).toEqual('aster')
        expect(reloaded.species).toEqual('cat')
      })

      context('when the last record in a batch has a primary key of 0', () => {
        it('advances the keyset cursor past it rather than re-reading the same batch forever', async () => {
          // an updated record still matches this Query, so a cursor that treats
          // a primary key of 0 as "no cursor" resets the window to the start of
          // the set on every pass and never terminates
          await ModelWithSerialPrimaryKey.create({ id: 0 } as any)

          expect(
            await ModelWithSerialPrimaryKey.query().update(() => ({}), { lock: false, batchSize: 1 })
          ).toEqual(1)
        })
      })

      it('calls model hooks on each written record', async () => {
        await Pet.create()

        await Pet.query().update(() => ({ name: 'change me' }), { lock: false })

        const pet = await Pet.first()
        expect(pet!.name).toEqual('changed by update hook')
      })

      it('honors a custom batchSize across multiple batches', async () => {
        for (let i = 0; i < 5; i++) await Pet.create({ name: 'aster' })

        const count = await Pet.where({ name: 'aster' }).update(() => ({ name: 'winner' }), {
          lock: false,
          batchSize: 2,
        })

        expect(count).toEqual(5)
        expect(await Pet.where({ name: 'winner' }).count()).toEqual(5)
      })

      context('skipHooks is passed', () => {
        it('skips hooks on each per-record write while custom setters still run, never taking the raw single-statement path', async () => {
          const pet = await Pet.create({ name: 'aster' })
          // the single-statement fast path writes through the driver's
          // Query-level update; the per-instance path does not
          const rawUpdateSpy = vi.spyOn(KyselyQueryDriver.prototype, 'update')

          const count = await Pet.where({ id: pet.id }).update(
            () => ({ name: 'change me', nickname: 'Pony' }),
            {
              lock: false,
              skipHooks: true,
            }
          )

          expect(count).toEqual(1)
          expect(rawUpdateSpy).not.toHaveBeenCalled()

          const reloaded = await Pet.findOrFail(pet.id)
          // hooks skipped: the BeforeUpdate hook would have rewritten this name
          expect(reloaded.name).toEqual('change me')
          // custom setters still ran: the raw fast path would have stored 'Pony' verbatim
          expect(reloaded.getAttribute('nickname')).toEqual('Li’l Pony')
        })
      })

      context('batchSize', () => {
        it('rejects an explicit 0 rather than handing findEach a limit of 0, which means "no limit"', async () => {
          await Pet.create({ name: 'aster' })
          const cb = vi.fn(() => ({ name: 'winner' }))

          await expect(Pet.query().update(cb, { lock: false, batchSize: 0 })).rejects.toThrow(
            InvalidBatchSize
          )

          expect(cb).not.toHaveBeenCalled()
          expect(await Pet.where({ name: 'aster' }).count()).toEqual(1)
        })

        it('rejects a negative batchSize', async () => {
          await expect(
            Pet.query().update(() => ({ name: 'winner' }), { lock: false, batchSize: -1 })
          ).rejects.toThrow(InvalidBatchSize)
        })

        it('rejects a fractional batchSize', async () => {
          await expect(
            Pet.query().update(() => ({ name: 'winner' }), { lock: false, batchSize: 1.5 })
          ).rejects.toThrow(InvalidBatchSize)
        })
      })

      context('when the Query already carries a transaction', () => {
        it('evaluates the callback and writes inside the caller’s transaction, so a rollback undoes every write', async () => {
          for (let i = 0; i < 3; i++) await Pet.create({ name: 'aster' })

          await expect(
            ApplicationModel.transaction(async txn => {
              const count = await Pet.query()
                .txn(txn)
                .where({ name: 'aster' })
                .update(() => ({ name: 'winner' }), { lock: false })

              expect(count).toEqual(3)
              expect(await Pet.query().txn(txn).where({ name: 'winner' }).count()).toEqual(3)

              throw new Error('breaking out of transaction')
            })
          ).rejects.toThrow('breaking out of transaction')

          expect(await Pet.where({ name: 'aster' }).count()).toEqual(3)
          expect(await Pet.where({ name: 'winner' }).count()).toEqual(0)
        })
      })
    })

    context('when the options omit an explicit lock boolean', () => {
      it('throws MissingRequiredLockOptionForUpdateCallback before touching any record', async () => {
        const pet = await Pet.create({ name: 'aster' })
        const cb = vi.fn(() => ({ name: 'winner' }))

        await expect((Pet.query() as any).update(cb)).rejects.toThrow(
          MissingRequiredLockOptionForUpdateCallback
        )
        await expect((Pet.query() as any).update(cb, { skipHooks: true })).rejects.toThrow(
          MissingRequiredLockOptionForUpdateCallback
        )

        expect(cb).not.toHaveBeenCalled()
        expect((await Pet.findOrFail(pet.id)).name).toEqual('aster')
      })

      it('throws when lock is present but not a boolean', async () => {
        const cb = vi.fn(() => ({ name: 'winner' }))

        await expect((Pet.query() as any).update(cb, { lock: null })).rejects.toThrow(
          MissingRequiredLockOptionForUpdateCallback
        )
        await expect((Pet.query() as any).update(cb, { lock: 1 })).rejects.toThrow(
          MissingRequiredLockOptionForUpdateCallback
        )

        expect(cb).not.toHaveBeenCalled()
      })
    })
  })

  context('batchSize', () => {
    it('rejects 0 on the locked path, which would otherwise lock the whole set', async () => {
      await Pet.create({ name: 'aster' })
      const applyRowLockSpy = vi.spyOn(PostgresQueryDriver.prototype, 'applyRowLock')

      await expect(
        Pet.where({ name: 'aster' }).update({ name: 'winner' }, { lock: true, batchSize: 0 })
      ).rejects.toThrow(InvalidBatchSize)

      expect(applyRowLockSpy).not.toHaveBeenCalled()
      expect(await Pet.where({ name: 'aster' }).count()).toEqual(1)
    })

    it('rejects a negative batchSize', async () => {
      await expect(Pet.query().update({ name: 'winner' }, { lock: true, batchSize: -1 })).rejects.toThrow(
        InvalidBatchSize
      )
    })

    it('rejects a fractional batchSize', async () => {
      await expect(Pet.query().update({ name: 'winner' }, { lock: true, batchSize: 1.5 })).rejects.toThrow(
        InvalidBatchSize
      )
    })
  })

  context('when the Query carries a limit or offset', () => {
    // every batched update path re-applies the Query's conditions to each
    // batch window, so a limit or offset cannot be honored — it would be
    // re-applied per batch, silently skipping or truncating rows within each
    // window — and silently discarding it would write rows the caller scoped
    // out. The single-statement skipHooks fast path rejects them too: its
    // SQL UPDATE cannot express a limit or offset.
    it('rejects them on the single-statement skipHooks attributes form', async () => {
      await Pet.create({ name: 'aster' })

      await expect(Pet.query().limit(1).update({ name: 'winner' }, { skipHooks: true })).rejects.toThrow(
        BatchingIncompatibleWithLimitOrOffset
      )
      await expect(Pet.query().offset(1).update({ name: 'winner' }, { skipHooks: true })).rejects.toThrow(
        BatchingIncompatibleWithLimitOrOffset
      )

      expect(await Pet.where({ name: 'aster' }).count()).toEqual(1)
    })

    it('rejects them on the locked attributes form', async () => {
      await Pet.create({ name: 'aster' })
      await Pet.create({ name: 'aster' })

      await expect(
        Pet.where({ name: 'aster' }).limit(1).update({ name: 'winner' }, { lock: true })
      ).rejects.toThrow(BatchingIncompatibleWithLimitOrOffset)
      await expect(
        Pet.where({ name: 'aster' }).offset(1).update({ name: 'winner' }, { lock: true, batchSize: 2 })
      ).rejects.toThrow(BatchingIncompatibleWithLimitOrOffset)

      expect(await Pet.where({ name: 'aster' }).count()).toEqual(2)
    })

    it('rejects them on the locked callback form', async () => {
      await Pet.create({ name: 'aster' })
      const cb = vi.fn(() => ({ name: 'winner' }))

      await expect(Pet.query().limit(1).update(cb, { lock: true })).rejects.toThrow(
        BatchingIncompatibleWithLimitOrOffset
      )
      await expect(Pet.query().offset(1).update(cb, { lock: true })).rejects.toThrow(
        BatchingIncompatibleWithLimitOrOffset
      )

      expect(cb).not.toHaveBeenCalled()
    })

    it('rejects them on the unlocked callback form', async () => {
      await Pet.create({ name: 'aster' })
      const cb = vi.fn(() => ({ name: 'winner' }))

      await expect(Pet.query().limit(1).update(cb, { lock: false })).rejects.toThrow(
        BatchingIncompatibleWithLimitOrOffset
      )
      await expect(Pet.query().offset(1).update(cb, { lock: false })).rejects.toThrow(
        BatchingIncompatibleWithLimitOrOffset
      )

      expect(cb).not.toHaveBeenCalled()
    })

    it('rejects them on the unlocked hook-running attributes form', async () => {
      await Pet.create({ name: 'aster' })

      await expect(Pet.query().limit(1).update({ name: 'winner' })).rejects.toThrow(
        BatchingIncompatibleWithLimitOrOffset
      )
      await expect(Pet.query().offset(1).update({ name: 'winner' })).rejects.toThrow(
        BatchingIncompatibleWithLimitOrOffset
      )

      expect(await Pet.where({ name: 'aster' }).count()).toEqual(1)
    })
  })

  context('regarding connections', () => {
    let spy: MockInstance

    beforeEach(async () => {
      await User.create({ email: 'fred@fred', password: 'howyadoin' })

      spy = vi.spyOn(DreamDbConnection, 'getConnection')
    })

    it('uses primary connection', async () => {
      await User.where({ email: 'fred@fred' }).update({ email: 'how@yadoin' })

      expect(spy).toHaveBeenCalledWith('default', 'primary', expect.anything())
    })

    context('with replica connection specified', () => {
      @ReplicaSafe()
      class CustomUser extends User {}

      it('uses the primary connection', async () => {
        await expect(CustomUser.findBy({ email: 'fred@fred' })).resolves.toBeTruthy()
        await CustomUser.where({ email: 'fred@fred' }).update({ email: 'how@yadoin' })

        // should always call to primary for update, regardless of replica-safe status
        expect(spy).toHaveBeenCalledWith('default', 'primary', expect.anything())
      })
    })
  })
})

// type tests intentionally skipped, since they will fail on build instead.
context.skip('type tests', () => {
  it('ensures invalid arguments error', async () => {
    await User.query().update({
      // @ts-expect-error intentionally passing invalid arg to test that type protection is working
      invalidArg: 123,
    })
  })

  it('rejects virtual columns when skipHooks is passed', async () => {
    // @ts-expect-error virtual and encrypted columns cannot be combined with skipHooks
    await User.query().update({ password: 'howyadoin' }, { skipHooks: true })
  })

  it('rejects encrypted columns when skipHooks is passed', async () => {
    // @ts-expect-error virtual and encrypted columns cannot be combined with skipHooks
    await User.query().update({ secret: 'howyadoin' }, { skipHooks: true })
  })

  context('lock', () => {
    it('accepts virtual and encrypted columns when lock is true, with or without skipHooks', async () => {
      await User.query().update({ password: 'howyadoin' }, { lock: true })
      await User.query().update({ secret: 'howyadoin' }, { lock: true, skipHooks: true })
      await User.query().update({ name: 'howyadoin' }, { lock: true, batchSize: 2, skipHooks: true })
    })

    it('accepts an explicit lock: false alongside table columns', async () => {
      await User.query().update({ name: 'howyadoin' }, { lock: false })
      await User.query().update({ name: 'howyadoin' }, { lock: false, skipHooks: true })
    })

    it('rejects virtual columns when lock is explicitly false', async () => {
      // @ts-expect-error an explicit lock: false keeps the raw single-statement typing
      await User.query().update({ password: 'howyadoin' }, { lock: false, skipHooks: true })
    })

    it('rejects batchSize without lock: true', async () => {
      // @ts-expect-error batchSize pairs only with lock: true
      await User.query().update({ name: 'howyadoin' }, { skipHooks: true, batchSize: 2 })
    })

    it('ensures invalid arguments error when lock is true', async () => {
      await User.query().update(
        {
          // @ts-expect-error intentionally passing invalid arg to test that type protection is working
          invalidArg: 123,
        },
        { lock: true }
      )
    })
  })

  context('callback form', () => {
    it('accepts a callback alongside an explicit lock boolean', async () => {
      await User.query().update(user => ({ name: user.email }), { lock: true })
      await User.query().update(() => undefined, { lock: false })
      await User.query().update(() => Promise.resolve({ password: 'howyadoin', secret: 'shh' }), {
        lock: true,
        batchSize: 2,
        skipHooks: true,
      })
      await User.query().update(() => ({ name: 'howyadoin' }), { lock: false, batchSize: 2, skipHooks: true })
    })

    it('rejects a callback without an options object', async () => {
      // @ts-expect-error a callback requires the options object with an explicit lock boolean
      await User.query().update(() => ({ name: 'howyadoin' }))
    })

    it('rejects a callback whose options omit the lock key', async () => {
      // @ts-expect-error a callback requires an explicit lock boolean
      await User.query().update(() => ({ name: 'howyadoin' }), { skipHooks: true })
    })

    it('rejects a callback returning invalid attributes', async () => {
      // @ts-expect-error intentionally returning an invalid arg to test that type protection is working
      await User.query().update(() => ({ invalidArg: 123 }), { lock: true })
    })
  })

  context('in a transaction', () => {
    it('ensures invalid arguments error', async () => {
      await ApplicationModel.transaction(async txn => {
        await User.txn(txn).queryInstance().update({
          // @ts-expect-error intentionally passing invalid arg to test that type protection is working
          invalidArg: 123,
        })
      })
    })
  })
})
