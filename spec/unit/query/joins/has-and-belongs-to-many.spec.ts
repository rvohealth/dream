import Node from '../../../../test-app/app/models/Graph/Node'
import Edge from '../../../../test-app/app/models/Graph/Edge'
import EdgeNode from '../../../../test-app/app/models/Graph/EdgeNode'

describe('Query#joins has and belongs to many', () => {
  it('joins the associated models', async () => {
    const node = await Node.create({ name: 'N1' })
    const edge1 = await Edge.create({ name: 'E1' })
    const edge2 = await Edge.create({ name: 'E2' })
    await EdgeNode.create({ node, edge: edge1 })
    await EdgeNode.create({ node, edge: edge2 })

    const reloadedNode = await Node.joins('edges')
      .where({ edges: { name: 'E2' } })
      .first()
    expect(reloadedNode).toMatchDreamModel(node)

    const reloadedNode2 = await Node.joins('edges')
      .where({ edges: { name: 'E3' } })
      .first()
    expect(reloadedNode2).toBeNull()
  })
})
