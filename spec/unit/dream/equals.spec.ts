import GraphEdge from '../../../test-app/app/models/Graph/Edge.js'
import GraphNode from '../../../test-app/app/models/Graph/Node.js'

describe('Dream#equals', () => {
  context('null', () => {
    it('is false', async () => {
      const node = await GraphNode.create({ name: 'Hello' })
      expect(node.equals(null)).toBe(false)
    })
  })

  context('undefined', () => {
    it('is false', async () => {
      const node = await GraphNode.create({ name: 'Hello' })
      expect(node.equals(undefined)).toBe(false)
    })
  })

  context('boolean', () => {
    it('is false', async () => {
      const node = await GraphNode.create({ name: 'Hello' })
      expect(node.equals(true)).toBe(false)
    })
  })

  context('number', () => {
    it('is false', async () => {
      const node = await GraphNode.create({ name: 'Hello' })
      expect(node.equals(1)).toBe(false)
    })
  })

  context('string', () => {
    it('is false', async () => {
      const node = await GraphNode.create({ name: 'Hello' })
      expect(node.equals('chalupas')).toBe(false)
    })
  })

  context('the same model loaded separately', () => {
    it('is true', async () => {
      const node = await GraphNode.create({ name: 'Hello' })
      const reloadedNode = await GraphNode.find(node.id)
      expect(node.equals(reloadedNode)).toBe(true)
    })
  })

  context('different models of the same type', () => {
    it('is false', async () => {
      const node1 = await GraphNode.create({ name: 'Hello' })
      const node2 = await GraphNode.create({ name: 'Hello' })
      expect(node1.equals(node2)).toBe(false)
    })
  })

  context('different models of different types', () => {
    it('is false', async () => {
      const node = await GraphNode.create({ name: 'Hello' })
      const edge = await GraphEdge.create({ name: 'Hello' })
      expect(node.equals(edge)).toBe(false)
    })
  })

  context('the instances are not persisted', () => {
    it('returns false', () => {
      const node1 = GraphNode.new({ name: 'Hello' })
      const node2 = GraphNode.new({ name: 'Hello' })
      expect(node1.equals(node2)).toBe(false)
    })
  })
})
