import { sql } from 'kysely'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Balloon from '../../../../test-app/app/models/Balloon.js'
import Animal from '../../../../test-app/app/models/Balloon/Latex/Animal.js'
import Latex from '../../../../test-app/app/models/Balloon/Latex.js'
import SortableStiModel from '../../../../test-app/app/models/SortableStiModel.js'
import SortableStiAlpha from '../../../../test-app/app/models/SortableStiModel/Alpha.js'
import SortableStiBeta from '../../../../test-app/app/models/SortableStiModel/Beta.js'
import User from '../../../../test-app/app/models/User.js'
import { STI_SCOPE_NAME } from '../../../../src/decorators/class/STI.js'
import Query from '../../../../src/dream/Query.js'
import RecordNotFound from '../../../../src/errors/RecordNotFound.js'
import processDynamicallyDefinedModels from '../../../helpers/processDynamicallyDefinedModels.js'

/**
 * Every model is globally initialized exactly once at boot, in the order the
 * model files are read off the filesystem, so an STI base may be initialized
 * before its children (`CoachTip/Base.ts` before `CoachTip/Video.ts`) or after
 * them (`Balloon/Latex.ts` before `Balloon.ts`). Re-initializing base-first
 * here reproduces the base-before-child order.
 */
describe('@Sortable on an STI base initialized before its children', () => {
  let user: User

  beforeEach(async () => {
    user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
    processDynamicallyDefinedModels(Balloon, Latex, Animal)
  })

  it('registers each sortable field on the child exactly once', () => {
    expect(Latex['sortableFields'].map(conf => conf.positionField)).toEqual(['positionAlpha', 'positionBeta'])

    expect(Animal['sortableFields'].map(conf => conf.positionField)).toEqual([
      'positionAlpha',
      'positionBeta',
    ])
  })

  it('positions newly created STI children contiguously from 1', async () => {
    const balloon1 = await Latex.create({ user })
    const balloon2 = await Latex.create({ user })

    expect(balloon1.positionAlpha).toEqual(1)
    expect(balloon2.positionAlpha).toEqual(2)
    expect(balloon1.positionBeta).toEqual(1)
    expect(balloon2.positionBeta).toEqual(2)
  })
})

describe('@Sortable when an STI discriminator changes', () => {
  it('moves the record between type-scoped position lists', async () => {
    await SortableStiAlpha.create()
    const alpha = await SortableStiAlpha.create()
    await SortableStiBeta.create()
    await SortableStiBeta.create()

    await alpha.update({ type: 'SortableStiBeta' })

    expect(await SortableStiAlpha.find(alpha.id)).toBeNull()
    expect(await SortableStiBeta.findOrFail(alpha.id)).toBeInstanceOf(SortableStiBeta)
    expect(await SortableStiAlpha.order('positionByType').pluck('positionByType')).toEqual([1])
    expect(await SortableStiBeta.order('positionByType').pluck('positionByType')).toEqual([1, 2, 3])
    expect(alpha.positionByType).toEqual(3)
    expect(alpha.dirtyAttributes()).toEqual({})
    expect(alpha.changes()).toEqual(
      expect.objectContaining({
        positionByType: { was: 2, now: 3 },
        type: { was: 'SortableStiAlpha', now: 'SortableStiBeta' },
      })
    )
    expect(alpha.savedChangeToAttribute('positionByType')).toBe(true)

    await alpha.update({ updatedAt: alpha.updatedAt.plus({ milliseconds: 1 }) })

    expect(alpha.positionByType).toEqual(3)
    expect(alpha.dirtyAttributes()).toEqual({})
    expect(alpha.savedChangeToAttribute('positionByType')).toBe(false)
    expect(alpha.previousValueForAttribute('positionByType')).toEqual(3)
  })

  it('moves an explicitly repositioned record when type is excluded from that position scope', async () => {
    await SortableStiAlpha.create()
    const alpha = await SortableStiAlpha.create()
    await SortableStiBeta.create()
    await SortableStiBeta.create()

    expect(SortableStiAlpha['sortableFields'].map(config => config.positionField)).toEqual([
      'positionIndependent',
      'positionByType',
    ])

    await alpha.update({ type: 'SortableStiBeta', positionIndependent: 1 })

    expect(await SortableStiAlpha.find(alpha.id)).toBeNull()
    expect(await SortableStiBeta.findOrFail(alpha.id)).toBeInstanceOf(SortableStiBeta)
    expect(await SortableStiModel.order('positionIndependent').pluck('positionIndependent')).toEqual([
      1, 2, 3, 4,
    ])
    expect(await SortableStiAlpha.order('positionByType').pluck('positionByType')).toEqual([1])
    expect(await SortableStiBeta.order('positionByType').pluck('positionByType')).toEqual([1, 2, 3])
    expect(alpha.positionIndependent).toEqual(1)
    expect(alpha.positionByType).toEqual(3)
    expect(alpha.dirtyAttributes()).toEqual({})
    expect(alpha.changes()).toEqual(
      expect.objectContaining({
        positionIndependent: { was: 2, now: 1 },
        positionByType: { was: 2, now: 3 },
        type: { was: 'SortableStiAlpha', now: 'SortableStiBeta' },
      })
    )
    expect(alpha.savedChangeToAttribute('positionIndependent')).toBe(true)
    expect(alpha.savedChangeToAttribute('positionByType')).toBe(true)

    await alpha.update({ updatedAt: alpha.updatedAt.plus({ milliseconds: 1 }) })

    expect(alpha.positionIndependent).toEqual(1)
    expect(alpha.positionByType).toEqual(3)
    expect(alpha.dirtyAttributes()).toEqual({})
    expect(alpha.savedChangeToAttribute('positionIndependent')).toBe(false)
    expect(alpha.savedChangeToAttribute('positionByType')).toBe(false)
    expect(alpha.previousValueForAttribute('positionIndependent')).toEqual(1)
    expect(alpha.previousValueForAttribute('positionByType')).toEqual(3)
  })

  it('does not refresh columns Sortable does not own', async () => {
    const alpha = await SortableStiAlpha.create()
    await SortableStiAlpha.create()

    await ApplicationModel.transaction(async txn => {
      await sql`
        CREATE FUNCTION sortable_sti_touch_unrelated_column() RETURNS trigger AS $$
        BEGIN
          NEW.updated_at := NEW.updated_at + interval '1 day';
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
      `.execute(txn.kyselyTransaction)
      await sql`
        CREATE TRIGGER sortable_sti_touch_unrelated_column
        BEFORE UPDATE OF position_independent ON sortable_sti_models
        FOR EACH ROW EXECUTE FUNCTION sortable_sti_touch_unrelated_column()
      `.execute(txn.kyselyTransaction)

      await alpha.txn(txn).update({ positionIndependent: 2 })

      const persisted = await SortableStiAlpha.txn(txn).findOrFail(alpha.id)
      expect(persisted.updatedAt).toEqual(alpha.updatedAt.plus({ days: 1 }))

      await sql`DROP TRIGGER sortable_sti_touch_unrelated_column ON sortable_sti_models`.execute(
        txn.kyselyTransaction
      )
      await sql`DROP FUNCTION sortable_sti_touch_unrelated_column()`.execute(txn.kyselyTransaction)
    })
  })

  it('refreshes only the position through the supplied STI-aware transaction query', async () => {
    const alpha = await SortableStiAlpha.create()
    await SortableStiBeta.create()
    const pluckSpy = vi.spyOn(Query.prototype, 'pluck')

    await ApplicationModel.transaction(async txn => {
      await alpha.txn(txn).update({ type: 'SortableStiBeta' })

      const refreshCallIndexes = pluckSpy.mock.contexts.reduce<number[]>((indexes, query, index) => {
        const typedQuery = query as Query<SortableStiModel>
        if (
          typedQuery['bypassAllDefaultScopes'] &&
          (typedQuery['defaultScopesToBypass'] as readonly string[]).includes(STI_SCOPE_NAME)
        ) {
          indexes.push(index)
        }
        return indexes
      }, [])

      expect(refreshCallIndexes).toHaveLength(1)
      const refreshCallIndex = refreshCallIndexes[0]!
      const refreshQuery = pluckSpy.mock.contexts[refreshCallIndex] as Query<SortableStiModel>
      expect(pluckSpy.mock.calls[refreshCallIndex]).toEqual(['positionByType'])
      expect(refreshQuery['dreamTransaction']).toBe(txn)
    })
  })

  it('raises RecordNotFound when the positioned row is truly absent', async () => {
    const alpha = await SortableStiAlpha.create()
    await SortableStiAlpha.create()

    await expect(
      ApplicationModel.transaction(async txn => {
        await sql`
          CREATE FUNCTION sortable_sti_delete_positioned_row() RETURNS trigger AS $$
          BEGIN
            DELETE FROM sortable_sti_models WHERE id = NEW.id;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql
        `.execute(txn.kyselyTransaction)
        await sql`
          CREATE TRIGGER sortable_sti_delete_positioned_row
          AFTER UPDATE OF position_independent ON sortable_sti_models
          FOR EACH ROW EXECUTE FUNCTION sortable_sti_delete_positioned_row()
        `.execute(txn.kyselyTransaction)

        await alpha.txn(txn).update({ positionIndependent: 2 })
      })
    ).rejects.toThrow(RecordNotFound)
  })
})
