import Edge from '../../../../test-app/app/models/Graph/Edge.js'
import EdgeNode from '../../../../test-app/app/models/Graph/EdgeNode.js'
import Node from '../../../../test-app/app/models/Graph/Node.js'

describe('Query#leftJoinPreload has and belongs to many', () => {
  it('loads the associated models', async () => {
    const node = await Node.create({ name: 'N1' })
    const edge1 = await Edge.create({ name: 'E1' })
    const edge2 = await Edge.create({ name: 'E2' })
    await EdgeNode.create({ node, edge: edge1 })
    await EdgeNode.create({ node, edge: edge2 })

    const reloadedNode = await Node.where({ id: node.id }).leftJoinPreload('edges').firstOrFail()
    expect(reloadedNode.edges).toMatchDreamModels([edge1, edge2])
  })
})
