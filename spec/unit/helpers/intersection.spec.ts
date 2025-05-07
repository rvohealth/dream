import intersection from '../../../src/helpers/intersection.js'
import GraphNode from '../../../test-app/app/models/Graph/Node.js'
import Pet from '../../../test-app/app/models/Pet.js'

describe('intersection', () => {
  context('an empty array', () => {
    it('returns an empty array', () => {
      expect(intersection([])).toEqual([])
    })
  })

  context('with a single array', () => {
    it('includes all the elements from the array', () => {
      expect(intersection(['world', 'hello', 'goodbye'])).toEqual(['world', 'hello', 'goodbye'])
    })
  })

  context('comparing Dream models', () => {
    beforeEach(async () => {})

    it('uses the custom Dream comparator', async () => {
      const graphNode1 = await GraphNode.create({ name: 'Hello' })
      const graphNode2 = await GraphNode.create({ name: 'Hello' })
      const graphNode3 = await GraphNode.find(graphNode1.id)

      expect(intersection([graphNode1, graphNode2], [graphNode3])).toMatchDreamModels([graphNode1])
    })

    it('can compare different types of Dreams', async () => {
      const graphNode1 = await GraphNode.create({ name: 'Hello' })
      const pet1 = await Pet.create({ name: 'Violet' })
      const graphNode2 = await GraphNode.findOrFail(graphNode1.id)
      const pet2 = await Pet.findOrFail(pet1.id)

      expect(intersection([graphNode1, pet1, graphNode2], [graphNode1, pet2])).toMatchDreamModels([
        graphNode1,
        pet1,
      ])
    })
  })

  context('when the elements are strings', () => {
    it('it compares the items directly', () => {
      expect(intersection(['world', 'hello', 'goodbye'], ['world', 'hello'])).toEqual(['world', 'hello'])
    })
  })

  it('supports mixed types', async () => {
    const graphNode1 = await GraphNode.create({ name: 'Hello' })
    const graphNode2 = await GraphNode.findOrFail(graphNode1.id)

    expect(
      intersection([graphNode1, 'world', 3, 7, 'hello', 7, 'hello'], [graphNode2, 'world', 3, 7, 'hello'])
    ).toEqual([graphNode1, 'world', 3, 7, 'hello'])
  })
})
