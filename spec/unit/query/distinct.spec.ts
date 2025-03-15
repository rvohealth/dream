import ops from '../../../src/ops/index.js'
import Edge from '../../../test-app/app/models/Graph/Edge.js'
import Node from '../../../test-app/app/models/Graph/Node.js'

describe('Query#distinct', () => {
  it('returns unique results distinct on the primary key', async () => {
    const node = await Node.create({ name: 'mynode' })
    const edge = await Edge.create({ name: 'myedge' })
    await node.createAssociation('edgeNodes', { edge })
    await node.createAssociation('edgeNodes', { edge })

    let ids = await Edge.innerJoin('edgeNodes').pluck('graph_edges.id')
    expect(ids).toEqual([edge.id, edge.id])

    ids = await Edge.innerJoin('edgeNodes').distinct().pluck('graph_edges.id')
    expect(ids).toEqual([edge.id])
  })

  context('with a specific column name passed', () => {
    it('returns unique results', async () => {
      const node = await Node.create({ name: 'mynode' })
      const edge1 = await Edge.create({ name: 'myedge' })
      const edge2 = await Edge.create({ name: 'myedge' })
      await node.createAssociation('edgeNodes', { edge: edge1 })
      await node.createAssociation('edgeNodes', { edge: edge2 })

      let ids = await Edge.innerJoin('edgeNodes').pluck('graph_edges.id')
      expect(ids).toEqual([edge1.id, edge2.id])

      ids = await Edge.innerJoin('edgeNodes').distinct('name').pluck('graph_edges.id')
      expect(ids).toEqual([edge1.id])
    })
  })

  context('with "true" passed', () => {
    it('returns unique results distinct on the primary key', async () => {
      const node = await Node.create({ name: 'mynode' })
      const edge = await Edge.create({ name: 'myedge' })
      await node.createAssociation('edgeNodes', { edge })
      await node.createAssociation('edgeNodes', { edge })

      let ids = await Edge.innerJoin('edgeNodes').pluck('graph_edges.id')
      expect(ids).toEqual([edge.id, edge.id])

      ids = await Edge.innerJoin('edgeNodes').distinct(true).pluck('graph_edges.id')
      expect(ids).toEqual([edge.id])
    })
  })

  context('when false is specified', () => {
    it('unsets distinct clause', async () => {
      const node = await Node.create({ name: 'mynode' })
      const edge1 = await Edge.create({ name: 'myedge' })
      const edge2 = await Edge.create({ name: 'myedge' })
      await node.createAssociation('edgeNodes', { edge: edge1 })
      await node.createAssociation('edgeNodes', { edge: edge2 })

      const ids = await Edge.innerJoin('edgeNodes').distinct('name').distinct(false).pluck('graph_edges.id')
      expect(ids).toEqual([edge1.id, edge2.id])
    })
  })

  context('with a similarity operator passed', () => {
    it('respects the similarity operator', async () => {
      const node = await Node.create({ name: 'mynode' })
      const edge1 = await Edge.create({ name: 'myedge' })
      const edge2 = await Edge.create({ name: 'myedge' })
      await node.createAssociation('edgeNodes', { edge: edge1 })
      await node.createAssociation('edgeNodes', { edge: edge2 })

      const ids = await Edge.innerJoin('edgeNodes')
        .distinct('name')
        .where({ name: ops.similarity('myedg') })
        .order({ 'graph_edges.name': 'desc' })
        .pluck('graph_edges.id')

      expect(ids).toEqual([edge1.id])
    })
  })
})
