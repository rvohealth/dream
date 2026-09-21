import cascadeEmptiesSortScope from '../../../../../src/decorators/field/sortable/helpers/cascadeEmptiesSortScope.js'
import { SortableCascadeEdge } from '../../../../../src/decorators/field/sortable/helpers/sortableCascadeEdge.js'
import { SortableFieldConfig } from '../../../../../src/decorators/field/sortable/Sortable.js'
import Dream from '../../../../../src/Dream.js'
import Collar from '../../../../../test-app/app/models/Collar.js'
import Pet from '../../../../../test-app/app/models/Pet.js'
import SortableCascadeChild from '../../../../../test-app/app/models/SortableCascadeChild.js'
import SortableCascadeOwner from '../../../../../test-app/app/models/SortableCascadeOwner.js'
import SortableStiAlpha from '../../../../../test-app/app/models/SortableStiModel/Alpha.js'

describe('cascadeEmptiesSortScope', () => {
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
    expect(cascadeEmptiesSortScope(child, sortableField(SortableCascadeChild, 'position'), children)).toBe(
      true
    )
  })

  it('is true when the sort scope adds a plain column to the edge’s foreign key', () => {
    expect(
      cascadeEmptiesSortScope(child, sortableField(SortableCascadeChild, 'positionWithinLabel'), children)
    ).toBe(true)
  })

  it('is false when the sort scope does not include the edge’s foreign key', () => {
    expect(
      cascadeEmptiesSortScope(child, sortableField(SortableCascadeChild, 'positionAcrossOwners'), children)
    ).toBe(false)
  })

  it('is false for a HasOne', () => {
    const oneChild = edge(SortableCascadeOwner, 'oneChild')
    expect(cascadeEmptiesSortScope(child, sortableField(SortableCascadeChild, 'position'), oneChild)).toBe(
      false
    )
  })

  it('is false for an edge with a condition', () => {
    const childrenLabeledA = edge(SortableCascadeOwner, 'childrenLabeledA')
    expect(
      cascadeEmptiesSortScope(child, sortableField(SortableCascadeChild, 'position'), childrenLabeledA)
    ).toBe(false)

    for (const condition of ['andNot', 'andAny', 'selfAnd', 'selfAndNot', 'polymorphic', 'through']) {
      expect(
        cascadeEmptiesSortScope(child, sortableField(SortableCascadeChild, 'position'), {
          ...children,
          [condition]: {},
        })
      ).toBe(false)
    }
  })

  it('is false when the target is an STI child', () => {
    const stiEdge = { ...children, foreignKey: () => 'type' }
    expect(
      cascadeEmptiesSortScope(
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
      cascadeEmptiesSortScope(Collar.new(), sortableField(Collar, 'position'), edge(Pet, 'collars'))
    ).toBe(false)
  })
})
