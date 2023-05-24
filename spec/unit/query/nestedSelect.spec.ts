import User from '../../../test-app/app/models/User'
import Node from '../../../test-app/app/models/Graph/Node'
import Edge from '../../../test-app/app/models/Graph/Edge'
import EdgeNode from '../../../test-app/app/models/Graph/EdgeNode'

describe('Query#nestedSelect', () => {
  it('allows nested select statements', async () => {
    const user1 = await User.create({
      email: 'fred@frewd',
      password: 'howyadoin',
    })
    const user2 = await User.create({
      email: 'frez@frewd',
      password: 'howyadoin',
    })
    await User.create({
      email: 'frez@fishman',
      password: 'howyadoin',
    })

    const records = await User.where({
      id: User.where({ id: [user1.id, user2.id] }).nestedSelect('id'),
    }).all()
    expect(records).toMatchDreamModels([user1, user2])
  })

  context('from a joins statement', () => {
    it('can pluck from the associated namespace', async () => {
      const node = await Node.create({ name: 'N1' })
      const edge1 = await Edge.create({ name: 'E1' })
      const edge2 = await Edge.create({ name: 'E2' })
      await EdgeNode.create({ node, edge: edge1 })
      await EdgeNode.create({ node, edge: edge2 })

      const edges = await Edge.where({
        id: Node.where({ id: node.id }).joins('edges').nestedSelect('edges.id'),
      }).all()
      expect(edges).toMatchDreamModels([edge1, edge2])
    })
  })
})
