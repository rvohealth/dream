import planSortableDestroyWork, {
  cascadeDestroysWholeSortScope,
} from '../../../../src/decorators/field/sortable/helpers/planSortableDestroyWork.js'
import { markSortableCascadeEdge } from '../../../../src/decorators/field/sortable/helpers/sortableCascadeEdge.js'
import { sortableScopeLockKeyForCurrentScope } from '../../../../src/decorators/field/sortable/helpers/sortableScopeLockKeys.js'
import { SortableFieldConfig } from '../../../../src/decorators/field/sortable/Sortable.js'
import PostgresQueryDriver from '../../../../src/dream/QueryDriver/Postgres.js'
import Dream from '../../../../src/Dream.js'
import SortableRequiresAdvisoryTransactionLocks from '../../../../src/errors/SortableRequiresAdvisoryTransactionLocks.js'
import SortableRequiresDeferrableConstraints from '../../../../src/errors/SortableRequiresDeferrableConstraints.js'
import MysqlQueryDriver from '../../../../test-app/app/conf/mysql/MysqlQueryDriver.js'
import Collar from '../../../../test-app/app/models/Collar.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import SortableCascadeChild from '../../../../test-app/app/models/SortableCascadeChild.js'
import SortableCascadeLeaf from '../../../../test-app/app/models/SortableCascadeLeaf.js'
import SortableCascadeOwner from '../../../../test-app/app/models/SortableCascadeOwner.js'
import SortableStiAlpha from '../../../../test-app/app/models/SortableStiModel/Alpha.js'

/**
 * A `dependent: 'destroy'` cascade takes one Sortable advisory lock per distinct
 * sort scope it touches and holds every one of them until the root transaction
 * commits. When the cascade is destroying a sort scope's owner, every row in
 * that scope is itself in the destroy set, so the compaction those locks protect
 * closes a vacancy nothing survives to observe. Both are skipped for exactly
 * that case, per (cascade edge, sortable field), and every other shape keeps the
 * locking it has always had.
 */
describe('@Sortable under a dependent-destroy cascade', () => {
  let owner: SortableCascadeOwner

  beforeEach(async () => {
    owner = await SortableCascadeOwner.create()
  })

  /**
   * Every advisory key the whole operation asked the driver for, in acquisition
   * order. `acquireSortableScopeLocks` drops keys the transaction already holds
   * before it reaches the driver, so what lands here is the set of *distinct*
   * scopes the operation serialized on.
   */
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

  context('an edge whose foreign key names the whole sort scope', () => {
    it('takes no Sortable scope lock at all when every field of every descendant qualifies', async () => {
      await SortableCascadeLeaf.create({ owner })
      await SortableCascadeLeaf.create({ owner })
      await SortableCascadeLeaf.create({ owner })

      const acquiredKeys = watchAcquiredScopeLockKeys()
      await owner.destroy()

      expect(acquiredKeys()).toEqual([])
      expect(await SortableCascadeLeaf.count()).toEqual(0)
    })

    it('skips only the qualifying fields, and still locks the scope that outlives the cascade', async () => {
      const child1 = await SortableCascadeChild.create({ owner, label: 'a' })
      const child2 = await SortableCascadeChild.create({ owner, label: 'b' })

      const acquiredKeys = watchAcquiredScopeLockKeys()
      await owner.destroy()

      // `positionAcrossOwners` is scoped on `label` alone, so its scopes span
      // owners and survive this cascade: those keys are still taken. The two
      // fields whose scope includes `ownerId` are not.
      expect(acquiredKeys().sort()).toEqual(
        [
          scopeLockKey(child1, 'positionAcrossOwners', 'label'),
          scopeLockKey(child2, 'positionAcrossOwners', 'label'),
        ].sort()
      )

      for (const child of [child1, child2]) {
        expect(acquiredKeys()).not.toContain(scopeLockKey(child, 'position', 'owner'))
        expect(acquiredKeys()).not.toContain(scopeLockKey(child, 'positionWithinLabel', ['owner', 'label']))
      }
    })

    it('still compacts the surviving scope of the field that did not qualify', async () => {
      const otherOwner = await SortableCascadeOwner.create()

      await SortableCascadeChild.create({ owner, label: 'a' })
      await SortableCascadeChild.create({ owner, label: 'a' })
      const survivor = await SortableCascadeChild.create({ owner: otherOwner, label: 'a' })

      expect(survivor.positionAcrossOwners).toEqual(3)

      await owner.destroy()

      expect((await SortableCascadeChild.findOrFail(survivor.id)).positionAcrossOwners).toEqual(1)
    })

    it('removes every descendant, exactly as it does today', async () => {
      await SortableCascadeChild.create({ owner, label: 'a' })
      await SortableCascadeChild.create({ owner, label: 'a' })
      await SortableCascadeLeaf.create({ owner })

      await owner.destroy()

      expect(await SortableCascadeChild.count()).toEqual(0)
      expect(await SortableCascadeLeaf.count()).toEqual(0)
    })
  })

  context('a direct destroy', () => {
    it('takes the scope lock of every field and compacts every scope, unchanged', async () => {
      const child1 = await SortableCascadeChild.create({ owner, label: 'a' })
      const child2 = await SortableCascadeChild.create({ owner, label: 'a' })
      const child3 = await SortableCascadeChild.create({ owner, label: 'a' })

      const acquiredKeys = watchAcquiredScopeLockKeys()
      await child1.destroy()

      expect(acquiredKeys().sort()).toEqual(
        [
          scopeLockKey(child1, 'position', 'owner'),
          scopeLockKey(child1, 'positionWithinLabel', ['owner', 'label']),
          scopeLockKey(child1, 'positionAcrossOwners', 'label'),
        ].sort()
      )

      for (const child of [child2, child3]) await child.reload()

      expect([child2.position, child3.position]).toEqual([1, 2])
      expect([child2.positionWithinLabel, child3.positionWithinLabel]).toEqual([1, 2])
      expect([child2.positionAcrossOwners, child3.positionAcrossOwners]).toEqual([1, 2])
    })

    it('plans every sortable field as locked, since no cascade edge reached the record', async () => {
      const child = await SortableCascadeChild.create({ owner, label: 'a' })

      const plan = planSortableDestroyWork(child)

      expect(positionFields(plan.locked)).toEqual(['position', 'positionWithinLabel', 'positionAcrossOwners'])
      expect(positionFields(plan.skipped)).toEqual([])
    })
  })

  context('an edge that leaves survivors in the sort scope', () => {
    it('keeps locking every field when the target carries a default scope of its own', async () => {
      // `Collar` declares `hideHiddenCollars` beside `@SoftDelete`, so the
      // cascade's own load cannot see every row of a scope, and a hidden collar
      // outlives its pet.
      const pet = await Pet.create({ name: 'aster' })
      const collar = await Collar.create({ pet, tagName: 'red' })

      const acquiredKeys = watchAcquiredScopeLockKeys()
      await pet.destroy()

      expect(acquiredKeys()).toContain(scopeLockKey(collar, 'position', ['pet', 'tagName']))
    })
  })

  context('the whole-scope predicate', () => {
    const childrenEdge = () => (SortableCascadeOwner['associationMetadataMap']() as any)['children']
    const config = (positionField: string) =>
      SortableCascadeChild['sortableFields'].find(
        (conf: SortableFieldConfig) => conf.positionField === positionField
      )!

    let child: SortableCascadeChild

    beforeEach(async () => {
      child = await SortableCascadeChild.create({ owner, label: 'a' })
    })

    it('qualifies a field whose scope is the edge foreign key', () => {
      expect(cascadeDestroysWholeSortScope(child, config('position'), childrenEdge())).toBe(true)
    })

    it('qualifies a field whose scope adds a plain column, which only narrows the same destroy set', () => {
      expect(cascadeDestroysWholeSortScope(child, config('positionWithinLabel'), childrenEdge())).toBe(true)
    })

    it('declines a field whose scope is a plain column that is not the edge foreign key', () => {
      expect(cascadeDestroysWholeSortScope(child, config('positionAcrossOwners'), childrenEdge())).toBe(false)
    })

    it('declines a direct destroy, which reaches the record through no edge', () => {
      expect(cascadeDestroysWholeSortScope(child, config('position'), null)).toBe(false)
    })

    it('declines a HasOne edge, which reaches one row of a scope that may hold others', () => {
      const oneChildEdge = (SortableCascadeOwner['associationMetadataMap']() as any)['oneChild']
      expect(cascadeDestroysWholeSortScope(child, config('position'), oneChildEdge)).toBe(false)
    })

    it('declines a conditioned edge, which destroys a subset of the foreign key rows', () => {
      const conditionedEdge = (SortableCascadeOwner['associationMetadataMap']() as any)['childrenLabeledA']
      expect(cascadeDestroysWholeSortScope(child, config('position'), conditionedEdge)).toBe(false)
    })

    for (const condition of ['andNot', 'andAny', 'selfAnd', 'selfAndNot'] as const) {
      it(`declines an edge carrying ${condition}`, () => {
        const edge = { ...childrenEdge(), [condition]: { label: 'a' } }
        expect(cascadeDestroysWholeSortScope(child, config('position'), edge)).toBe(false)
      })
    }

    it('declines a polymorphic edge, whose foreign key identifies a row only with its type column', () => {
      const edge = { ...childrenEdge(), polymorphic: true }
      expect(cascadeDestroysWholeSortScope(child, config('position'), edge)).toBe(false)
    })

    it('declines a through edge', () => {
      const edge = { ...childrenEdge(), through: 'somethingElse' }
      expect(cascadeDestroysWholeSortScope(child, config('position'), edge)).toBe(false)
    })

    it('declines an STI child target, whose sort scope holds every subclass of rows', async () => {
      const stiRecord = await SortableStiAlpha.create()
      const stiConfig = SortableStiAlpha['sortableFields'].find(
        (conf: SortableFieldConfig) => conf.positionField === 'positionByType'
      )!
      const edge = { ...childrenEdge(), foreignKey: () => 'type' }

      expect(cascadeDestroysWholeSortScope(stiRecord, stiConfig, edge)).toBe(false)
    })

    it('declines a target carrying a default scope other than SoftDelete', async () => {
      const pet = await Pet.create({ name: 'aster' })
      const collar = await Collar.create({ pet, tagName: 'red' })
      const collarsEdge = (Pet['associationMetadataMap']() as any)['collars']
      const collarConfig = Collar['sortableFields'].find(
        (conf: SortableFieldConfig) => conf.positionField === 'position'
      )!

      expect(cascadeDestroysWholeSortScope(collar, collarConfig, collarsEdge)).toBe(false)
    })
  })

  context('the capability assertion on the skipped path', () => {
    it('is declared for both engines, and the seam carries what the design depends on', () => {
      expect(PostgresQueryDriver.supportsDeferrableConstraints).toBe(true)
      expect(MysqlQueryDriver.supportsDeferrableConstraints).toBe(false)
    })

    context('on a driver that cannot take advisory transaction locks', () => {
      it('fails loudly rather than cascading unserialized', async () => {
        await SortableCascadeLeaf.create({ owner })
        PostgresQueryDriver.supportsAdvisoryTransactionLocks = false

        try {
          await expect(owner.destroy()).rejects.toThrow(SortableRequiresAdvisoryTransactionLocks)
        } finally {
          PostgresQueryDriver.supportsAdvisoryTransactionLocks = true
        }

        expect(await SortableCascadeLeaf.count()).toEqual(1)
      })
    })

    context('on a driver whose database cannot defer a unique constraint to commit', () => {
      it('fails loudly rather than cascading where an intruder could commit a duplicate', async () => {
        await SortableCascadeLeaf.create({ owner })
        PostgresQueryDriver.supportsDeferrableConstraints = false

        try {
          await expect(owner.destroy()).rejects.toThrow(SortableRequiresDeferrableConstraints)
        } finally {
          PostgresQueryDriver.supportsDeferrableConstraints = true
        }

        expect(await SortableCascadeLeaf.count()).toEqual(1)
      })

      it('leaves a direct destroy alone, which still serializes on its scope lock', async () => {
        const leaf = await SortableCascadeLeaf.create({ owner })
        PostgresQueryDriver.supportsDeferrableConstraints = false

        try {
          await leaf.destroy()
        } finally {
          PostgresQueryDriver.supportsDeferrableConstraints = true
        }

        expect(await SortableCascadeLeaf.count()).toEqual(0)
      })
    })

    it('runs even when the cascade would have taken no key at all, which is where the old guard returned early', async () => {
      // `acquireSortableScopeLocks` returns before its own capability guard on
      // an empty key list, and an all-skipped cascade presents exactly that. The
      // replacement assertion is unconditional, so a model whose every sortable
      // field skips still refuses.
      const leaf = await SortableCascadeLeaf.create({ owner })
      markSortableCascadeEdge(leaf, (SortableCascadeOwner['associationMetadataMap']() as any)['leaves'])
      PostgresQueryDriver.supportsAdvisoryTransactionLocks = false

      try {
        expect(() => planSortableDestroyWork(leaf)).toThrow(SortableRequiresAdvisoryTransactionLocks)
      } finally {
        PostgresQueryDriver.supportsAdvisoryTransactionLocks = true
      }
    })
  })

  context('the cascade-edge marker', () => {
    it('is consumed by the destroy it was left for, so a later direct destroy cannot inherit its optimism', async () => {
      const child = await SortableCascadeChild.create({ owner, label: 'a' })
      markSortableCascadeEdge(child, childrenEdgeFor())

      expect(positionFields(planSortableDestroyWork(child).skipped)).toEqual([
        'position',
        'positionWithinLabel',
      ])
      expect(positionFields(planSortableDestroyWork(child).skipped)).toEqual([])
    })

    function childrenEdgeFor() {
      return (SortableCascadeOwner['associationMetadataMap']() as any)['children']
    }
  })
})
