import DreamTransaction from '../../../../src/dream/DreamTransaction.js'
import PostgresQueryDriver from '../../../../src/dream/QueryDriver/Postgres.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import SortableCascadeChild from '../../../../test-app/app/models/SortableCascadeChild.js'
import SortableCascadeOwner from '../../../../test-app/app/models/SortableCascadeOwner.js'

describe('@Sortable under a dependent-destroy cascade', () => {
  let owner: SortableCascadeOwner
  let otherOwner: SortableCascadeOwner

  beforeEach(async () => {
    owner = await SortableCascadeOwner.create()
    otherOwner = await SortableCascadeOwner.create()
  })

  afterEach(() => {
    SortableCascadeChild.afterUpdateCallback = null
  })

  describe('destroying the owner', () => {
    it('takes no Sortable scope lock and destroys every child', async () => {
      await SortableCascadeChild.create({ owner, label: 'a' })
      await SortableCascadeChild.create({ owner, label: 'b' })

      const acquireLocks = vi.spyOn(PostgresQueryDriver, 'acquireAdvisoryTransactionLocks')
      await owner.destroy()

      expect(acquireLocks).not.toHaveBeenCalled()
      expect(await SortableCascadeChild.count()).toEqual(0)
    })

    it('compacts the sort scope that survives the cascade', async () => {
      await SortableCascadeChild.create({ owner, label: 'a' })
      await SortableCascadeChild.create({ owner, label: 'a' })
      const survivor = await SortableCascadeChild.create({ owner: otherOwner, label: 'a' })
      expect(survivor.positionAcrossOwners).toEqual(3)

      await owner.destroy()

      await survivor.reload()
      expect(survivor.positionAcrossOwners).toEqual(1)
    })

    it('does the same on a hard destroy', async () => {
      await SortableCascadeChild.create({ owner, label: 'a' })
      const survivor = await SortableCascadeChild.create({ owner: otherOwner, label: 'a' })

      const acquireLocks = vi.spyOn(PostgresQueryDriver, 'acquireAdvisoryTransactionLocks')
      await owner.reallyDestroy()

      expect(acquireLocks).not.toHaveBeenCalled()
      expect(await SortableCascadeChild.removeAllDefaultScopes().count()).toEqual(1)
      await survivor.reload()
      expect(survivor.positionAcrossOwners).toEqual(1)
    })
  })

  describe('undestroying the owner', () => {
    it('takes no Sortable scope lock and restores every child with the position it had', async () => {
      await SortableCascadeChild.create({ owner, label: 'a' })
      await SortableCascadeChild.create({ owner, label: 'a' })
      await SortableCascadeChild.create({ owner, label: 'b' })
      await owner.destroy()

      const acquireLocks = vi.spyOn(PostgresQueryDriver, 'acquireAdvisoryTransactionLocks')
      await owner.undestroy()

      expect(acquireLocks).not.toHaveBeenCalled()
      const children = await SortableCascadeChild.order('id').all()
      expect(children.map(child => child.position)).toEqual([1, 2, 3])
      expect(children.map(child => child.positionWithinLabel)).toEqual([1, 2, 1])
      expect(children.map(child => child.positionAcrossOwners)).toEqual([1, 2, 1])
    })

    it('appends restored children after one created while the owner was deleted', async () => {
      const restored = await SortableCascadeChild.create({ owner, label: 'a' })
      await owner.destroy()
      const incumbent = await SortableCascadeChild.create({ owner, label: 'a' })

      await owner.undestroy()

      await incumbent.reload()
      await restored.reload()
      expect(incumbent.position).toEqual(1)
      expect(restored.position).toEqual(2)
    })

    it('runs the whole undestroy again when its COMMIT is refused by a sort scope’s unique constraint', async () => {
      const restored = await SortableCascadeChild.create({ owner, label: 'a' })
      await owner.destroy()

      // the restored child has just been given position 1 in the cascade's
      // transaction; a second live row at position 1 in the same scope, written
      // in that same transaction, is what a concurrent writer of the scope
      // leaves behind, and the deferrable unique constraint refuses it at COMMIT
      let attempts = 0
      SortableCascadeChild.afterUpdateCallback = async (_, txn) => {
        attempts++
        if (attempts === 1) await insertChildAtPosition(txn, 1)
      }

      await owner.undestroy()

      expect(attempts).toEqual(2)
      await restored.reload()
      expect(restored.position).toEqual(1)
      expect(await SortableCascadeChild.count()).toEqual(1)
    })

    it('lets the refusal surface when the transaction is the caller’s', async () => {
      await SortableCascadeChild.create({ owner, label: 'a' })
      await owner.destroy()

      let attempts = 0
      SortableCascadeChild.afterUpdateCallback = async (_, txn) => {
        attempts++
        await insertChildAtPosition(txn, 1)
      }

      await expect(
        ApplicationModel.transaction(async txn => {
          await owner.txn(txn).undestroy()
        })
      ).rejects.toThrow(/duplicate key value/)

      expect(attempts).toEqual(1)
      expect(await SortableCascadeChild.count()).toEqual(0)
    })

    async function insertChildAtPosition(txn: DreamTransaction<any>, position: number) {
      await txn.kyselyTransaction
        .insertInto('sortable_cascade_children')
        .values({ owner_id: owner.id, label: 'b', position, created_at: new Date(), updated_at: new Date() })
        .execute()
    }
  })

  describe('a child destroyed or undestroyed directly', () => {
    it('takes the scope lock of every sortable field and compacts every scope', async () => {
      const child1 = await SortableCascadeChild.create({ owner, label: 'a' })
      const child2 = await SortableCascadeChild.create({ owner, label: 'a' })

      const acquireLocks = vi.spyOn(PostgresQueryDriver, 'acquireAdvisoryTransactionLocks')
      await child1.destroy()

      expect(acquireLocks.mock.calls.flatMap(([, keys]) => keys)).toHaveLength(3)
      await child2.reload()
      expect(child2.position).toEqual(1)
      expect(child2.positionWithinLabel).toEqual(1)
      expect(child2.positionAcrossOwners).toEqual(1)
    })

    it('takes the scope lock of every sortable field and appends to every scope', async () => {
      const child1 = await SortableCascadeChild.create({ owner, label: 'a' })
      await SortableCascadeChild.create({ owner, label: 'a' })
      await child1.destroy()

      const acquireLocks = vi.spyOn(PostgresQueryDriver, 'acquireAdvisoryTransactionLocks')
      await child1.undestroy()

      expect(acquireLocks.mock.calls.flatMap(([, keys]) => keys)).toHaveLength(3)
      expect(child1.position).toEqual(2)
      expect(child1.positionWithinLabel).toEqual(2)
      expect(child1.positionAcrossOwners).toEqual(2)
    })
  })
})
