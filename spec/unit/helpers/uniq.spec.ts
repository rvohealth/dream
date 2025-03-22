import uniq from '../../../src/helpers/uniq.js'
import Mylar from '../../../test-app/app/models/Balloon/Mylar.js'
import GraphNode from '../../../test-app/app/models/Graph/Node.js'

describe('uniq', () => {
  context('when the first element is a Dream', () => {
    beforeEach(async () => {})

    it('uses the custom Dream comparator', async () => {
      const graphNode1 = await GraphNode.create({ name: 'Hello' })
      const graphNode2 = await GraphNode.create({ name: 'Hello' })
      const graphNode3 = await GraphNode.find(graphNode1.id)

      expect(uniq([graphNode1, graphNode2, graphNode3])).toMatchObject([graphNode1, graphNode2])
    })

    context('when a custom comparator is passed', () => {
      it('still uses the Dream comparator', async () => {
        const graphNode1 = await GraphNode.create({ name: 'Hello' })
        const graphNode2 = await GraphNode.create({ name: 'Hello' })
        const graphNode3 = await GraphNode.findOrFail(graphNode1.id)

        expect(uniq([graphNode1, graphNode2, graphNode3], (a: GraphNode) => a.name!)).toMatchObject([
          graphNode1,
          graphNode2,
        ])
      })
    })

    context('different types of Dreams', () => {
      it('uses the custom comparator', async () => {
        const graphNode1 = await GraphNode.create({ name: 'Hello' })
        const balloon = await Mylar.create()
        const graphNode2 = await GraphNode.findOrFail(graphNode1.id)

        expect(uniq([graphNode1, balloon, graphNode2], (a: GraphNode) => a.name!)).toMatchObject([
          graphNode1,
          balloon,
        ])
      })
    })
  })

  context('when the first element is not a Dream', () => {
    it('it compares the items directly', () => {
      expect(uniq(['world', 'hello', 'hello'])).toMatchObject(['world', 'hello'])
    })

    context('when a custom comparator is passed', () => {
      it('uses the custom comparator', () => {
        expect(uniq(['world', 'hello', 'hello', ''], (str: string) => str.length)).toMatchObject([
          'world',
          '',
        ])
      })
    })
  })

  it('supports mixed types', async () => {
    const graphNode1 = await GraphNode.create({ name: 'Hello' })
    const graphNode2 = await GraphNode.findOrFail(graphNode1.id)

    expect(uniq([graphNode1, 'world', 3, 7, graphNode2, 'hello', 7, 'hello'])).toMatchObject([
      graphNode1,
      'world',
      3,
      7,
      'hello',
    ])
  })
})
