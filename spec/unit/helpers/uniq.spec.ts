import uniq from '../../../src/helpers/uniq.js'
import Mylar from '../../../test-app/app/models/Balloon/Mylar.js'
import GraphNode from '../../../test-app/app/models/Graph/Node.js'

describe('uniq', () => {
  context('comparing Dream models', () => {
    it('uses the custom Dream comparator', async () => {
      const graphNode1 = await GraphNode.create({ name: 'Hello' })
      const graphNode2 = await GraphNode.create({ name: 'Hello' })
      const graphNode3 = await GraphNode.find(graphNode1.id)

      expect(uniq([graphNode1, graphNode2, graphNode3])).toEqual([graphNode1, graphNode2])
    })

    context('when a custom comparator is passed', () => {
      it('still uses the Dream comparator', async () => {
        const graphNode1 = await GraphNode.create({ name: 'Hello' })
        const graphNode2 = await GraphNode.create({ name: 'Hello' })
        const graphNode3 = await GraphNode.findOrFail(graphNode1.id)

        expect(uniq([graphNode1, graphNode2, graphNode3], (a: GraphNode) => a.name!)).toEqual([
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

        expect(uniq([graphNode1, balloon, graphNode2], (a: GraphNode) => a.name!)).toEqual([
          graphNode1,
          balloon,
        ])
      })
    })
  })

  context('when the elements are strings', () => {
    it('compares the items directly', () => {
      expect(uniq(['world', 'hello', 'hello'])).toEqual(['world', 'hello'])
    })

    context('when a custom comparator is passed', () => {
      it('uses the custom comparator', () => {
        expect(uniq(['world', 'hello', 'hello', ''], (str: string) => str.length)).toEqual(['world', ''])
      })
    })
  })

  context('when the elements are functions with identical toString() but different references', () => {
    it('treats them as distinct', () => {
      // Simulates what happens under vitest SSR transform: two different
      // serializer functions from different modules compile to identical
      // source text because import placeholders are numbered the same way.
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const fn1 = new Function('a', 'return a + 1')
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const fn2 = new Function('a', 'return a + 1')

      // Verify precondition: same toString, different references
      expect(fn1.toString()).toBe(fn2.toString())
      expect(fn1).not.toBe(fn2)

      expect(uniq([fn1, fn2])).toEqual([fn1, fn2])
    })
  })

  it('supports mixed types', async () => {
    const graphNode1 = await GraphNode.create({ name: 'Hello' })
    const graphNode2 = await GraphNode.findOrFail(graphNode1.id)

    expect(uniq([graphNode1, 'world', 3, 7, graphNode2, 'hello', 7, 'hello'])).toEqual([
      graphNode1,
      'world',
      3,
      7,
      'hello',
    ])
  })
})
