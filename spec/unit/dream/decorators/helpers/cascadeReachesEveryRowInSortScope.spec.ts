import cascadeReachesEveryRowInSortScope from '../../../../../src/decorators/field/sortable/helpers/cascadeReachesEveryRowInSortScope.js'
import { SortableCascadeEdge } from '../../../../../src/decorators/field/sortable/helpers/sortableCascadeEdge.js'
import { SortableFieldConfig } from '../../../../../src/decorators/field/sortable/Sortable.js'
import Dream from '../../../../../src/Dream.js'
import Collar from '../../../../../test-app/app/models/Collar.js'
import Pet from '../../../../../test-app/app/models/Pet.js'
import SortableCascadeChild from '../../../../../test-app/app/models/SortableCascadeChild.js'
import SortableCascadeOwner from '../../../../../test-app/app/models/SortableCascadeOwner.js'
import SortableStiAlpha from '../../../../../test-app/app/models/SortableStiModel/Alpha.js'

/**
 * Every association below is a `dependent: 'destroy'` edge, the only kind the
 * predicate is ever asked about; it is declined or accepted for its shape.
 */
describe('cascadeReachesEveryRowInSortScope', () => {
  function edge(dreamClass: typeof Dream, associationName: string): SortableCascadeEdge {
    return dreamClass['associationMetadataMap']()[associationName] as SortableCascadeEdge
  }

  function sortableField(dreamClass: typeof Dream, positionField: string): SortableFieldConfig {
    return dreamClass['sortableFields'].find(
      (config: SortableFieldConfig) => config.positionField === positionField
    )!
  }

  let child: SortableCascadeChild
  let children: SortableCascadeEdge

  beforeEach(() => {
    child = SortableCascadeChild.new()
    children = edge(SortableCascadeOwner, 'children')
  })

  it('is true when the sort scope is the edge’s foreign key', () => {
    expect(
      cascadeReachesEveryRowInSortScope(child, sortableField(SortableCascadeChild, 'position'), children)
    ).toBe(true)
  })

  it('is true when the sort scope adds a plain column to the edge’s foreign key', () => {
    expect(
      cascadeReachesEveryRowInSortScope(
        child,
        sortableField(SortableCascadeChild, 'positionWithinLabel'),
        children
      )
    ).toBe(true)
  })

  it('is false when the sort scope does not include the edge’s foreign key', () => {
    expect(
      cascadeReachesEveryRowInSortScope(
        child,
        sortableField(SortableCascadeChild, 'positionAcrossOwners'),
        children
      )
    ).toBe(false)
  })

  it('is false for a HasOne', () => {
    const oneChild = edge(SortableCascadeOwner, 'oneChild')
    expect(
      cascadeReachesEveryRowInSortScope(child, sortableField(SortableCascadeChild, 'position'), oneChild)
    ).toBe(false)
  })

  it('is false for a HasMany with an `and` condition', () => {
    // the children the condition does not match stay live under a soft-deleted
    // owner, holding positions in a scope the cascade did not empty
    const childrenLabeledA = edge(SortableCascadeOwner, 'childrenLabeledA')
    expect(
      cascadeReachesEveryRowInSortScope(
        child,
        sortableField(SortableCascadeChild, 'position'),
        childrenLabeledA
      )
    ).toBe(false)
  })

  for (const condition of ['andNot', 'andAny', 'selfAnd', 'selfAndNot'] as const) {
    it(`is false for a HasMany with an \`${condition}\` condition`, () => {
      expect(
        cascadeReachesEveryRowInSortScope(child, sortableField(SortableCascadeChild, 'position'), {
          ...children,
          [condition]: { label: 'a' },
        })
      ).toBe(false)
    })
  }

  it('is false for a polymorphic HasMany, whose foreign key identifies a row only with its type column', () => {
    expect(
      cascadeReachesEveryRowInSortScope(child, sortableField(SortableCascadeChild, 'position'), {
        ...children,
        polymorphic: true,
      })
    ).toBe(false)
  })

  it('is false for a through association', () => {
    expect(
      cascadeReachesEveryRowInSortScope(child, sortableField(SortableCascadeChild, 'position'), {
        ...children,
        through: 'somethingElse',
      })
    ).toBe(false)
  })

  it('is false when the target is an STI child', () => {
    const stiEdge = { ...children, foreignKey: () => 'type' }
    expect(
      cascadeReachesEveryRowInSortScope(
        SortableStiAlpha.new(),
        sortableField(SortableStiAlpha, 'positionByType'),
        stiEdge
      )
    ).toBe(false)
  })

  it('is false when the target has a default scope other than SoftDelete', () => {
    // Collar declares `hideHiddenCollars` beside `@SoftDelete`, so a hidden
    // collar is not in the cascade’s load and outlives its pet
    expect(
      cascadeReachesEveryRowInSortScope(Collar.new(), sortableField(Collar, 'position'), edge(Pet, 'collars'))
    ).toBe(false)
  })
})
