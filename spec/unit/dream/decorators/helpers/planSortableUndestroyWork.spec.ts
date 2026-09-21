import planSortableUndestroyWork from '../../../../../src/decorators/field/sortable/helpers/planSortableUndestroyWork.js'
import { markSortableCascadeEdge } from '../../../../../src/decorators/field/sortable/helpers/sortableCascadeEdge.js'
import { SortableFieldConfig } from '../../../../../src/decorators/field/sortable/Sortable.js'
import SortableCascadeChild from '../../../../../test-app/app/models/SortableCascadeChild.js'
import SortableCascadeOwner from '../../../../../test-app/app/models/SortableCascadeOwner.js'

/**
 * The per-field decision an undestroy makes before it touches the database:
 * which sortable fields take their ordinary scope lock and are positioned
 * inline, and which are restored optimistically and positioned later by one
 * whole-scope statement.
 *
 * Driven directly rather than through a cascade, so a field landing on the
 * wrong side of the split is visible here as a plan, rather than only as a
 * lock that was or was not acquired several layers away. The end-to-end
 * behavior each plan produces is covered in
 * `spec/unit/dream/decorators/sortable-cascade-undestroy.spec.ts`.
 */
describe('planSortableUndestroyWork', () => {
  let owner: SortableCascadeOwner

  beforeEach(async () => {
    owner = await SortableCascadeOwner.create()
  })

  const childrenEdge = () => (SortableCascadeOwner['associationMetadataMap']() as any)['children']

  function positionFields(configs: SortableFieldConfig[]) {
    return configs.map(({ positionField }) => positionField)
  }

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

  /**
   * The marker is read destructively, and that is load-bearing rather than
   * tidiness: a field planned optimistic is positioned only by the restore
   * batch its association call created, and a direct undestroy has no such
   * batch. An edge left behind on the instance would therefore plan a later
   * direct undestroy optimistic and leave its row committed at a NULL position,
   * with nothing to renumber it.
   */
  it('consumes the edge, so a later direct undestroy cannot inherit its optimism', async () => {
    const child = await SortableCascadeChild.create({ owner, label: 'a' })
    markSortableCascadeEdge(child, childrenEdge())

    expect(positionFields(planSortableUndestroyWork(child).optimistic).length).toBeGreaterThan(0)
    expect(positionFields(planSortableUndestroyWork(child).optimistic)).toEqual([])
  })
})
