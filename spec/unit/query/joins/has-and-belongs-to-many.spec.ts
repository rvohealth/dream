import Node from '../../../../test-app/app/models/Graph/Node'
import Edge from '../../../../test-app/app/models/Graph/Edge'
import EdgeNode from '../../../../test-app/app/models/Graph/EdgeNode'
import ops from '../../../../src/ops'

describe('Query#joins has and belongs to many', () => {
  it('joins the associated models', async () => {
    const node = await Node.create({ name: 'N1' })
    const edge1 = await Edge.create({ name: 'E1' })
    const edge2 = await Edge.create({ name: 'E2' })
    await EdgeNode.create({ node, edge: edge1 })
    await EdgeNode.create({ node, edge: edge2 })

    const reloadedNode = await Node.joins('edges', { name: 'E2' }).first()
    expect(reloadedNode).toMatchDreamModel(node)

    const reloadedNode2 = await Node.joins('edges', { name: 'E3' }).first()
    expect(reloadedNode2).toBeNull()
  })

  context('when passed a similarity operator', () => {
    it('filters out results that do not match the text', async () => {
      await Node.create({ name: 'franklin rosevelt' })
      await Edge.create({ name: 'harry s truman' })
      await Edge.create({ name: 'dwight d eisenhower' })

      const node = await Node.create({ name: 'warren g harding' })
      const edge1 = await Edge.create({ name: 'calvin coolidge' })
      const edge2 = await Edge.create({ name: 'herbert hoover' })
      await EdgeNode.create({ node, edge: edge1 })
      await EdgeNode.create({ node, edge: edge2 })

      const reloadedNode = await Node.joins('edges', { name: ops.similarity('coolidge') }).first()
      expect(reloadedNode).toMatchDreamModel(node)

      const reloadedNode2 = await Node.joins('edges', { name: ops.similarity('nonmatch') }).first()
      expect(reloadedNode2).toBeNull()
    })
  })
})
