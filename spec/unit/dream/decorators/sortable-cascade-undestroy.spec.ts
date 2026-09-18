import planSortableUndestroyWork from '../../../../src/decorators/field/sortable/helpers/planSortableUndestroyWork.js'
import * as restoreSortableScopePositionsModule from '../../../../src/decorators/field/sortable/helpers/restoreSortableScopePositions.js'
import { markSortableCascadeEdge } from '../../../../src/decorators/field/sortable/helpers/sortableCascadeEdge.js'
import { sortableScopeLockKeyForCurrentScope } from '../../../../src/decorators/field/sortable/helpers/sortableScopeLockKeys.js'
import { SortableFieldConfig } from '../../../../src/decorators/field/sortable/Sortable.js'
import PostgresQueryDriver from '../../../../src/dream/QueryDriver/Postgres.js'
import Dream from '../../../../src/Dream.js'
import SortableRequiresAdvisoryTransactionLocks from '../../../../src/errors/SortableRequiresAdvisoryTransactionLocks.js'
import SortableRequiresDeferrableConstraints from '../../../../src/errors/SortableRequiresDeferrableConstraints.js'
import SortableCascadeChild from '../../../../test-app/app/models/SortableCascadeChild.js'
import SortableCascadeOwner from '../../../../test-app/app/models/SortableCascadeOwner.js'

/**
 * The undestroy side of the same rule. An undestroy cascade re-enters the same
 * transaction once per descendant and takes a scope lock for each, accumulating
 * exactly as the destroy side did. Where the cascade covers a sort scope whole,
 * the restore takes no lock and positions the row with one idempotent
 * whole-scope statement ranked NULLS LAST, which reproduces what the locked
 * `coalesce(max(position), 0) + 1` produces.
 */
describe('@Sortable under a dependent-destroy undestroy cascade', () => {
  let owner: SortableCascadeOwner

  beforeEach(async () => {
    owner = await SortableCascadeOwner.create()
    SortableCascadeChild.observedPositionsInAfterUpdate = []
    SortableCascadeChild.observedPositionsInAfterUpdateCommit = []
  })

  function watchAcquiredScopeLockKeys() {
    const spy = vi.spyOn(PostgresQueryDriver, 'acquireAdvisoryTransactionLocks')
    return () => spy.mock.calls.flatMap(([, keys]) => keys)
  }

  function scopeLockKey(dream: Dream, positionField: string, scope: string | string[]) {
    return sortableScopeLockKeyForCurrentScope(dream, positionField, scope)
  }

  function positionFields(configs: SortableFieldConfig[]) {
    return configs.map(({ positionField }) => positionField)
  }

  async function positionsByLabel(label: string) {
    const children = await SortableCascadeChild.order('id').all()
    return children.filter(child => child.label === label).map(child => child.position)
  }

  async function positionsWithinLabel(label: string) {
    const children = await SortableCascadeChild.order('id').all()
    return children.filter(child => child.label === label).map(child => child.positionWithinLabel)
  }

  context('a cascade that restores a sort scope whole', () => {
    it('acquires no scope lock for the fields whose scope the cascade covers', async () => {
      const child1 = await SortableCascadeChild.create({ owner, label: 'a' })
      const child2 = await SortableCascadeChild.create({ owner, label: 'a' })
      await owner.destroy()

      const acquiredKeys = watchAcquiredScopeLockKeys()
      await owner.undestroy()

      for (const child of [child1, child2]) {
        expect(acquiredKeys()).not.toContain(scopeLockKey(child, 'position', 'owner'))
        expect(acquiredKeys()).not.toContain(scopeLockKey(child, 'positionWithinLabel', ['owner', 'label']))
      }
    })

    it('restores the same positions the locked path produces, in primary-key order', async () => {
      const child1 = await SortableCascadeChild.create({ owner, label: 'a' })
      const child2 = await SortableCascadeChild.create({ owner, label: 'a' })
      const child3 = await SortableCascadeChild.create({ owner, label: 'a' })

      expect([child1.position, child2.position, child3.position]).toEqual([1, 2, 3])

      await owner.destroy()
      await owner.undestroy()

      expect(await positionsByLabel('a')).toEqual([1, 2, 3])
    })

    it('leaves a live incumbent where it is and appends the restored rows after it', async () => {
      // created under the soft-deleted owner while its children were deleted:
      // nothing stops a child being created under a soft-deleted parent, since
      // soft delete is an UPDATE and the parent row is still there
      const restored1 = await SortableCascadeChild.create({ owner, label: 'a' })
      const restored2 = await SortableCascadeChild.create({ owner, label: 'a' })
      await owner.destroy()

      const incumbent = await SortableCascadeChild.create({ owner, label: 'a' })
      expect(incumbent.position).toEqual(1)

      await owner.undestroy()

      for (const child of [restored1, restored2, incumbent]) await child.reload()

      expect(incumbent.position).toEqual(1)
      expect([restored1.position, restored2.position]).toEqual([2, 3])
    })

    it('absorbs a row committed into the scope before the restore rather than failing', async () => {
      const restored = await SortableCascadeChild.create({ owner, label: 'a' })
      await owner.destroy()

      const intruder = await SortableCascadeChild.create({ owner, label: 'a' })

      await owner.undestroy()

      await intruder.reload()
      await restored.reload()

      expect([intruder.position, restored.position]).toEqual([1, 2])
    })

    it('renumbers a sparse scope, keeping relative order while the integers change', async () => {
      const restored = await SortableCascadeChild.create({ owner, label: 'a' })
      await owner.destroy()

      const incumbent = await SortableCascadeChild.create({ owner, label: 'a' })
      // a scope left sparse by something outside the ORM's position paths
      await incumbent.update({ position: 7 }, { skipHooks: true })

      await owner.undestroy()

      for (const child of [incumbent, restored]) await child.reload()

      expect(incumbent.position).toEqual(1)
      expect(restored.position).toEqual(2)
    })

    it('renumbers each scope once for the whole cascade, however many rows it restored', async () => {
      const renumberSpy = vi.spyOn(restoreSortableScopePositionsModule, 'default')

      try {
        for (let i = 0; i < 5; i++) await SortableCascadeChild.create({ owner, label: 'a' })
        await owner.destroy()

        renumberSpy.mockClear()
        await owner.undestroy()

        // One statement per optimistic sort scope, not per restored record:
        // `position` scoped on the owner, and `positionWithinLabel` scoped on
        // the owner and the single label these five share. Five restored rows,
        // two statements. `positionAcrossOwners` and `positionWithinGroup` are
        // planned locked and positioned inline, so they are not here.
        expect(renumberSpy.mock.calls.length).toEqual(2)
        expect(await positionsByLabel('a')).toEqual([1, 2, 3, 4, 5])
      } finally {
        renumberSpy.mockRestore()
      }
    })

    it('renumbers each distinct scope the cascade reached, not just the first', async () => {
      const renumberSpy = vi.spyOn(restoreSortableScopePositionsModule, 'default')

      try {
        await SortableCascadeChild.create({ owner, label: 'a' })
        await SortableCascadeChild.create({ owner, label: 'a' })
        await SortableCascadeChild.create({ owner, label: 'b' })
        await owner.destroy()

        renumberSpy.mockClear()
        await owner.undestroy()

        // `position` has one scope (the owner); `positionWithinLabel` has two,
        // one per label. Three scopes, three statements.
        expect(renumberSpy.mock.calls.length).toEqual(3)
        expect(await positionsByLabel('a')).toEqual([1, 2])
        expect(await positionsByLabel('b')).toEqual([3])
        expect(await positionsWithinLabel('a')).toEqual([1, 2])
        expect(await positionsWithinLabel('b')).toEqual([1])
      } finally {
        renumberSpy.mockRestore()
      }
    })

    it('lets an afterUpdate hook mid-cascade see the restored row at a null position', async () => {
      await SortableCascadeChild.create({ owner, label: 'a' })
      await SortableCascadeChild.create({ owner, label: 'a' })
      await owner.destroy()

      SortableCascadeChild.observedPositionsInAfterUpdate = []
      await owner.undestroy()

      // The transient this route accepts, pinned rather than left implicit: the
      // scope is renumbered once at the end of the cascade, so a hook running
      // per record sees the optimistic fields still NULL. The locked fields
      // (`positionAcrossOwners`, `positionWithinGroup`) are positioned inline
      // by the same statement that cleared `deletedAt`, so they are never NULL.
      expect(SortableCascadeChild.observedPositionsInAfterUpdate.length).toEqual(2)
      for (const [
        position,
        positionWithinLabel,
        positionAcrossOwners,
        positionWithinGroup,
      ] of SortableCascadeChild.observedPositionsInAfterUpdate) {
        expect(position).toBeNull()
        expect(positionWithinLabel).toBeNull()
        expect(positionAcrossOwners).not.toBeNull()
        expect(positionWithinGroup).not.toBeNull()
      }
    })

    it('never lets that null outlive the transaction: a commit hook sees the final positions', async () => {
      await SortableCascadeChild.create({ owner, label: 'a' })
      await SortableCascadeChild.create({ owner, label: 'a' })
      await owner.destroy()

      SortableCascadeChild.observedPositionsInAfterUpdateCommit = []
      await owner.undestroy()

      // `afterUpdateCommit` runs after COMMIT, against the same instance the
      // cascade restored, so the refresh that follows the renumber is what
      // keeps the transient inside the transaction.
      expect(SortableCascadeChild.observedPositionsInAfterUpdateCommit).toEqual([
        [1, 1, 1, 1],
        [2, 2, 2, 2],
      ])
    })

    it('is idempotent: a second undestroy matches no row and moves nothing', async () => {
      await SortableCascadeChild.create({ owner, label: 'a' })
      await SortableCascadeChild.create({ owner, label: 'a' })
      await owner.destroy()
      await owner.undestroy()

      expect(await positionsByLabel('a')).toEqual([1, 2])

      SortableCascadeChild.observedPositionsInAfterUpdate = []
      await owner.undestroy()

      expect(await positionsByLabel('a')).toEqual([1, 2])
      expect(SortableCascadeChild.observedPositionsInAfterUpdate).toEqual([])
    })

    it('still locks and inline-positions the field whose scope outlives the cascade', async () => {
      const otherOwner = await SortableCascadeOwner.create()
      const child = await SortableCascadeChild.create({ owner, label: 'a' })
      await owner.destroy()

      const survivor = await SortableCascadeChild.create({ owner: otherOwner, label: 'a' })
      expect(survivor.positionAcrossOwners).toEqual(1)

      const acquiredKeys = watchAcquiredScopeLockKeys()
      await owner.undestroy()

      expect(acquiredKeys()).toContain(scopeLockKey(child, 'positionAcrossOwners', 'label'))

      await child.reload()
      expect(child.positionAcrossOwners).toEqual(2)
    })
  })

  context('the plan', () => {
    const childrenEdge = () => (SortableCascadeOwner['associationMetadataMap']() as any)['children']

    it('declines a scope with a nullable member, which a deferrable constraint cannot serialize', async () => {
      const child = await SortableCascadeChild.create({ owner, label: 'a' })
      markSortableCascadeEdge(child, childrenEdge())

      const plan = planSortableUndestroyWork(child)

      // `positionWithinGroup` is scoped on the nullable `groupName`: a NULLS
      // DISTINCT unique constraint would let a collision commit instead of
      // aborting, so the restore keeps today's lock for it even though the
      // cascade covers its scope — and the destroy side, which writes no
      // position, still skips it.
      expect(positionFields(plan.optimistic)).toEqual(['position', 'positionWithinLabel'])
      expect(positionFields(plan.locked)).toEqual(['positionAcrossOwners', 'positionWithinGroup'])
    })

    it('plans every field as locked for a direct undestroy, which carries no edge', async () => {
      const child = await SortableCascadeChild.create({ owner, label: 'a' })

      const plan = planSortableUndestroyWork(child)

      expect(positionFields(plan.optimistic)).toEqual([])
      expect(positionFields(plan.locked)).toEqual([
        'position',
        'positionWithinLabel',
        'positionAcrossOwners',
        'positionWithinGroup',
      ])
    })

    it('consumes the edge, so a later direct undestroy cannot inherit its optimism', async () => {
      const child = await SortableCascadeChild.create({ owner, label: 'a' })
      markSortableCascadeEdge(child, childrenEdge())

      expect(positionFields(planSortableUndestroyWork(child).optimistic).length).toBeGreaterThan(0)
      expect(positionFields(planSortableUndestroyWork(child).optimistic)).toEqual([])
    })
  })

  context('a direct undestroy', () => {
    it('is unchanged: it takes the scope lock of every field and appends at max + 1', async () => {
      const child1 = await SortableCascadeChild.create({ owner, label: 'a' })
      const child2 = await SortableCascadeChild.create({ owner, label: 'a' })

      await child1.destroy()
      await child2.reload()
      expect(child2.position).toEqual(1)

      const acquiredKeys = watchAcquiredScopeLockKeys()
      await child1.undestroy()

      expect(acquiredKeys()).toContain(scopeLockKey(child1, 'position', 'owner'))
      expect(acquiredKeys()).toContain(scopeLockKey(child1, 'positionWithinLabel', ['owner', 'label']))

      await child1.reload()
      expect(child1.position).toEqual(2)
    })

    it('is unchanged on a driver whose database cannot defer a unique constraint', async () => {
      const child = await SortableCascadeChild.create({ owner, label: 'a' })
      await child.destroy()

      PostgresQueryDriver.supportsDeferrableConstraints = false

      try {
        await child.undestroy()
      } finally {
        PostgresQueryDriver.supportsDeferrableConstraints = true
      }

      await child.reload()
      expect(child.position).toEqual(1)
    })
  })

  context('the capability assertion on the optimistic path', () => {
    it('fails loudly without advisory transaction locks rather than restoring unserialized', async () => {
      await SortableCascadeChild.create({ owner, label: 'a' })
      await owner.destroy()

      PostgresQueryDriver.supportsAdvisoryTransactionLocks = false

      try {
        await expect(owner.undestroy()).rejects.toThrow(SortableRequiresAdvisoryTransactionLocks)
      } finally {
        PostgresQueryDriver.supportsAdvisoryTransactionLocks = true
      }

      expect(await SortableCascadeChild.count()).toEqual(0)
    })

    it('fails loudly without deferred constraint checking, which is what makes the abort clean', async () => {
      await SortableCascadeChild.create({ owner, label: 'a' })
      await owner.destroy()

      PostgresQueryDriver.supportsDeferrableConstraints = false

      try {
        await expect(owner.undestroy()).rejects.toThrow(SortableRequiresDeferrableConstraints)
      } finally {
        PostgresQueryDriver.supportsDeferrableConstraints = true
      }

      expect(await SortableCascadeChild.count()).toEqual(0)
    })
  })
})
