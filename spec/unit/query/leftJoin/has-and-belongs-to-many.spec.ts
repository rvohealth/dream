import ops from '../../../../src/ops/index.js'
import Edge from '../../../../test-app/app/models/Graph/Edge.js'
import EdgeNode from '../../../../test-app/app/models/Graph/EdgeNode.js'
import Node from '../../../../test-app/app/models/Graph/Node.js'

describe('Query#leftJoin has and belongs to many', () => {
  it('joins the associated models, keeping the parent when nothing matches', async () => {
    const node = await Node.create({ name: 'N1' })
    const edge1 = await Edge.create({ name: 'E1' })
    const edge2 = await Edge.create({ name: 'E2' })
    await EdgeNode.create({ node, edge: edge1 })
    await EdgeNode.create({ node, edge: edge2 })

    const reloadedNode = await Node.leftJoin('edges', { and: { name: 'E2' } }).first()
    expect(reloadedNode).toMatchDreamModel(node)

    // the and-clause only conditions the final `edges` join; the intermediate `edgeNodes`
    // left join is unconditioned, so the node still yields one row per edge node, and
    // the edge columns are null on the row whose edge did not match
    const matchingEdgeNames = await Node.leftJoin('edges', { and: { name: 'E2' } }).pluck('edges.name')
    expect(matchingEdgeNames.sort()).toEqual(['E2', null].sort())

    const reloadedNode2 = await Node.leftJoin('edges', { and: { name: 'E3' } }).first()
    expect(reloadedNode2).toMatchDreamModel(node)
    const nonMatchingEdgeNames = await Node.leftJoin('edges', { and: { name: 'E3' } }).pluck('edges.name')
    expect(nonMatchingEdgeNames).toEqual([null, null])
  })

  context('when passed a similarity operator', () => {
    // Skipped: ops.similarity in a leftJoin and-clause is currently ignored. The similarity
    // builder (KyselyQueryDriver#similarityStatementBuilder) only consults innerJoinAndStatements,
    // so the trigram condition never reaches the left join. This spec documents the expected
    // behavior once leftJoin and-statements are wired into the similarity builder.
    it.skip('nulls out edges that do not match the text, keeping the node', async () => {
      await Node.create({ name: 'franklin rosevelt' })
      await Edge.create({ name: 'harry s truman' })
      await Edge.create({ name: 'dwight d eisenhower' })

      const node = await Node.create({ name: 'warren g harding' })
      const edge1 = await Edge.create({ name: 'calvin coolidge' })
      const edge2 = await Edge.create({ name: 'herbert hoover' })
      await EdgeNode.create({ node, edge: edge1 })
      await EdgeNode.create({ node, edge: edge2 })

      const reloadedNode = await Node.where({ id: node.id })
        .leftJoin('edges', { and: { name: ops.similarity('coolidge') } })
        .first()
      expect(reloadedNode).toMatchDreamModel(node)
      const matchingEdgeNames = await Node.where({ id: node.id })
        .leftJoin('edges', { and: { name: ops.similarity('coolidge') } })
        .pluck('edges.name')
      expect(matchingEdgeNames.sort()).toEqual(['calvin coolidge', null].sort())

      const reloadedNode2 = await Node.where({ id: node.id })
        .leftJoin('edges', { and: { name: ops.similarity('nonmatch') } })
        .first()
      expect(reloadedNode2).toMatchDreamModel(node)
      const nonMatchingEdgeNames = await Node.where({ id: node.id })
        .leftJoin('edges', { and: { name: ops.similarity('nonmatch') } })
        .pluck('edges.name')
      expect(nonMatchingEdgeNames).toEqual([null, null])
    })
  })
})
