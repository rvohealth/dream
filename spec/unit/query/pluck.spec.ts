import User from '../../../test-app/app/models/User'
import Node from '../../../test-app/app/models/Graph/Node'
import Edge from '../../../test-app/app/models/Graph/Edge'
import EdgeNode from '../../../test-app/app/models/Graph/EdgeNode'

describe('Query#pluck', () => {
  let user1: User
  let user2: User
  let user3: User

  beforeEach(async () => {
    user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
    user3 = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
  })

  it('plucks the specified attributes and returns them as raw data', async () => {
    const records = await User.order('id').pluck('id')
    expect(records).toEqual([user1.id, user2.id, user3.id])
  })

  context('with multiple fields', () => {
    it('should return multi-dimensional array', async () => {
      const records = await User.order('id').pluck('id', 'created_at')
      expect(records).toEqual([
        [user1.id, user1.created_at],
        [user2.id, user2.created_at],
        [user3.id, user3.created_at],
      ])
    })
  })

  context('in a has and belongs to many', () => {
    it('can pluck from the associated namespace', async () => {
      const node = await Node.create({ name: 'N1' })
      const edge1 = await Edge.create({ name: 'E1' })
      const edge2 = await Edge.create({ name: 'E2' })
      await EdgeNode.create({ node, edge: edge1 })
      await EdgeNode.create({ node, edge: edge2 })

      const edgeIds = await Node.where({ id: node.id }).joins('edges').pluck('edges.id')
      expect(edgeIds).toMatchObject([edge1.id, edge2.id])
    })
  })
})
