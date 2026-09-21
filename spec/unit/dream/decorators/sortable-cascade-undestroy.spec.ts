import planSortableUndestroyWork from '../../../../src/decorators/field/sortable/helpers/planSortableUndestroyWork.js'
import * as restoreSortableScopePositionsModule from '../../../../src/decorators/field/sortable/helpers/restoreSortableScopePositions.js'
import { markSortableCascadeEdge } from '../../../../src/decorators/field/sortable/helpers/sortableCascadeEdge.js'
import { sortableScopeLockKeyForCurrentScope } from '../../../../src/decorators/field/sortable/helpers/sortableScopeLockKeys.js'
import { SortableFieldConfig } from '../../../../src/decorators/field/sortable/Sortable.js'
import PostgresQueryDriver from '../../../../src/dream/QueryDriver/Postgres.js'
import Dream from '../../../../src/Dream.js'
import SortableRequiresAdvisoryTransactionLocks from '../../../../src/errors/SortableRequiresAdvisoryTransactionLocks.js'
import SortableRequiresDeferrableConstraints from '../../../../src/errors/SortableRequiresDeferrableConstraints.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import SortableCascadeChild from '../../../../test-app/app/models/SortableCascadeChild.js'
import SortableCascadeOwner from '../../../../test-app/app/models/SortableCascadeOwner.js'
import SortableCascadePair from '../../../../test-app/app/models/SortableCascadePair.js'
import SortableCascadePairOwner from '../../../../test-app/app/models/SortableCascadePairOwner.js'

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

    it('renumbers each scope once for the association that restored it, however many rows that was', async () => {
      const renumberSpy = vi.spyOn(restoreSortableScopePositionsModule, 'default')

      try {
        for (let i = 0; i < 5; i++) await SortableCascadeChild.create({ owner, label: 'a' })
        await owner.destroy()

        renumberSpy.mockClear()
        await owner.undestroy()

        // One statement per optimistic sort scope the association restored
        // into, not per restored record: `position` scoped on the owner, and
        // `positionWithinLabel` scoped on the owner and the single label these
        // five share. Five restored rows, two statements.
        // `positionAcrossOwners` and `positionWithinGroup` are planned locked
        // and positioned inline, so they are not here.
        expect(renumberSpy.mock.calls.length).toEqual(2)
        expect(await positionsByLabel('a')).toEqual([1, 2, 3, 4, 5])
      } finally {
        renumberSpy.mockRestore()
      }
    })

    it('renumbers each distinct scope the association reached, not just the first', async () => {
      const renumberSpy = vi.spyOn(restoreSortableScopePositionsModule, 'default')

      try {
        await SortableCascadeChild.create({ owner, label: 'a' })
        await SortableCascadeChild.create({ owner, label: 'a' })
        await SortableCascadeChild.create({ owner, label: 'b' })
        await owner.destroy()

        renumberSpy.mockClear()
        await owner.undestroy()

        // `position` has one scope (the owner); `positionWithinLabel` has two,
        // one per label. One association call, three scopes, three statements.
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
      // scope is renumbered once the association restoring it has restored
      // every one of its rows, so a hook running per record sees the optimistic
      // fields still NULL. The locked fields
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

  context('a second cascade interleaved with the first', () => {
    async function liveChildren() {
      return await SortableCascadeChild.order('id').all()
    }

    it("renumbers the scopes an afterUpdate hook's own cascaded undestroy restored", async () => {
      // the hook's cascade runs on the same transaction, after the first
      // cascade has already renumbered its own children's scopes
      const hookOwner = await SortableCascadeOwner.create()
      await SortableCascadeChild.create({ owner: hookOwner, label: 'b' })
      await SortableCascadeChild.create({ owner: hookOwner, label: 'b' })
      await hookOwner.destroy()

      await SortableCascadeChild.create({ owner, label: 'a' })
      await owner.destroy()

      SortableCascadeOwner.undestroyDuringAfterUpdate = hookOwner
      try {
        // this owner's `children` association renumbers what it restored, and
        // then this owner's own `afterUpdate` hooks restore `hookOwner`'s
        // children into two more scopes
        await owner.undestroy()
      } finally {
        SortableCascadeOwner.undestroyDuringAfterUpdate = null
      }

      // read back after COMMIT: this is the whole point of the finding — the
      // transient NULL a cascade accepts ends at COMMIT, and a row that commits
      // without a position is never given one afterwards
      const children = await liveChildren()
      expect(children.length).toEqual(3)
      for (const child of children) {
        expect(child.position).not.toBeNull()
        expect(child.positionWithinLabel).not.toBeNull()
      }

      expect(await positionsByLabel('a')).toEqual([1])
      expect(await positionsByLabel('b')).toEqual([1, 2])
      expect(await positionsWithinLabel('b')).toEqual([1, 2])
    })

    it('renumbers both cascades when two share one caller-supplied transaction', async () => {
      const otherOwner = await SortableCascadeOwner.create()
      await SortableCascadeChild.create({ owner, label: 'a' })
      await SortableCascadeChild.create({ owner, label: 'a' })
      await SortableCascadeChild.create({ owner: otherOwner, label: 'b' })
      await SortableCascadeChild.create({ owner: otherOwner, label: 'b' })
      await owner.destroy()
      await otherOwner.destroy()

      // one transaction, two cascades, interleaved: each association call
      // renumbers what it itself restored, so the two share no state to get
      // wrong about which of them owes the other a position
      await ApplicationModel.transaction(async txn => {
        await Promise.all([owner.txn(txn).undestroy(), otherOwner.txn(txn).undestroy()])
      })

      const children = await liveChildren()
      expect(children.length).toEqual(4)
      for (const child of children) {
        expect(child.position).not.toBeNull()
        expect(child.positionWithinLabel).not.toBeNull()
      }

      expect(await positionsByLabel('a')).toEqual([1, 2])
      expect(await positionsByLabel('b')).toEqual([1, 2])
    })
  })

  /**
   * The shape the rest of this file cannot reach: `SortableCascadePair`'s sort
   * scope is `['owner', 'coOwner']`, and both of those foreign keys carry a
   * `dependent: 'destroy'` edge from `SortableCascadePairOwner`, so one cascade
   * restores the same table through two qualifying edges — and, through
   * `subOwners`, through an edge one level deeper as well.
   *
   * What each spec here pins is that renumbering a scope when the association
   * that restored its rows finishes is enough, because that association's
   * children *are* the scope: whichever edge gets there first has restored every
   * row of the scopes it renumbers, and the other edge finds nothing left to
   * restore into them.
   */
  context('two dependent associations feeding one sort scope', () => {
    let pairOwner: SortableCascadePairOwner
    let otherOwner: SortableCascadePairOwner

    beforeEach(async () => {
      pairOwner = await SortableCascadePairOwner.create()
      otherOwner = await SortableCascadePairOwner.create()
    })

    async function positionsIn(owner: SortableCascadePairOwner, coOwner: SortableCascadePairOwner) {
      const pairs = await SortableCascadePair.order('id').all()
      return pairs
        .filter(
          pair => String(pair.ownerId) === String(owner.id) && String(pair.coOwnerId) === String(coOwner.id)
        )
        .map(pair => pair.position)
    }

    it('restores every scope to 1..n, whichever of the two edges reached it', async () => {
      // reached by both of this owner's edges
      await SortableCascadePair.create({ owner: pairOwner, coOwner: pairOwner })
      await SortableCascadePair.create({ owner: pairOwner, coOwner: pairOwner })
      // reached by `ownedPairs` alone
      await SortableCascadePair.create({ owner: pairOwner, coOwner: otherOwner })
      // reached by `coOwnedPairs` alone
      await SortableCascadePair.create({ owner: otherOwner, coOwner: pairOwner })

      await pairOwner.destroy()
      expect(await SortableCascadePair.count()).toEqual(0)

      await pairOwner.undestroy()

      expect(await positionsIn(pairOwner, pairOwner)).toEqual([1, 2])
      expect(await positionsIn(pairOwner, otherOwner)).toEqual([1])
      expect(await positionsIn(otherOwner, pairOwner)).toEqual([1])
    })

    it('renumbers a scope both edges cover exactly once: the second edge restores nothing into it', async () => {
      const renumberSpy = vi.spyOn(restoreSortableScopePositionsModule, 'default')

      try {
        await SortableCascadePair.create({ owner: pairOwner, coOwner: pairOwner })
        await SortableCascadePair.create({ owner: pairOwner, coOwner: pairOwner })
        await SortableCascadePair.create({ owner: pairOwner, coOwner: otherOwner })
        await SortableCascadePair.create({ owner: otherOwner, coOwner: pairOwner })
        await pairOwner.destroy()

        renumberSpy.mockClear()
        await pairOwner.undestroy()

        // `ownedPairs` runs first and restores three rows into two scopes — two
        // statements. `coOwnedPairs` then matches the two rows `ownedPairs`
        // already brought back, restores neither, and collects only the one row
        // nothing else reached — a third statement, for a third scope. The
        // scope both edges cover is renumbered once, by the edge that restored
        // it.
        expect(renumberSpy.mock.calls.length).toEqual(3)
      } finally {
        renumberSpy.mockRestore()
      }
    })

    it('takes no scope lock for the pairs, through either edge', async () => {
      const pair = await SortableCascadePair.create({ owner: pairOwner, coOwner: pairOwner })
      await SortableCascadePair.create({ owner: otherOwner, coOwner: pairOwner })
      await pairOwner.destroy()

      const acquiredKeys = watchAcquiredScopeLockKeys()
      await pairOwner.undestroy()

      expect(acquiredKeys()).not.toContain(scopeLockKey(pair, 'position', ['owner', 'coOwner']))
    })

    it('renumbers a scope a deeper edge restored, though a shallower edge covers it too', async () => {
      const subOwner = await SortableCascadePairOwner.create({ parent: pairOwner })

      // `subOwner.coOwnedPairs` reaches these one level down; `pairOwner.ownedPairs`
      // covers the same scope one level up, and runs second
      await SortableCascadePair.create({ owner: pairOwner, coOwner: subOwner })
      await SortableCascadePair.create({ owner: pairOwner, coOwner: subOwner })
      await SortableCascadePair.create({ owner: subOwner, coOwner: subOwner })

      await pairOwner.destroy()
      expect(await SortableCascadePair.count()).toEqual(0)
      expect(await SortableCascadePairOwner.count()).toEqual(1)

      await pairOwner.undestroy()

      // read back after COMMIT: a row the deeper edge renumbered before the
      // shallower one ran must still hold that position, and nothing may commit
      // without one
      const pairs = await SortableCascadePair.all()
      expect(pairs.length).toEqual(3)
      for (const pair of pairs) expect(pair.position).not.toBeNull()

      expect(await positionsIn(pairOwner, subOwner)).toEqual([1, 2])
      expect(await positionsIn(subOwner, subOwner)).toEqual([1])
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
