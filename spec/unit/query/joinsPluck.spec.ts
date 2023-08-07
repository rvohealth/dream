import User from '../../../test-app/app/models/User'
import Node from '../../../test-app/app/models/Graph/Node'
import Edge from '../../../test-app/app/models/Graph/Edge'
import EdgeNode from '../../../test-app/app/models/Graph/EdgeNode'
import Composition from '../../../test-app/app/models/Composition'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'

describe('Query#joinsPluck', () => {
  context('in a has and belongs to many', () => {
    it('can pluck from the associated namespace', async () => {
      const node = await Node.create({ name: 'N1' })
      const edge1 = await Edge.create({ name: 'E1' })
      const edge2 = await Edge.create({ name: 'E2' })
      await EdgeNode.create({ node, edge: edge1 })
      await EdgeNode.create({ node, edge: edge2 })

      const edgeIds = await Node.where({ id: node.id }).joinsPluck('edgeNodes', 'edge', { name: 'E1' }, [
        'edge.id',
        'edge.name',
      ])
      expect(edgeIds).toEqual([[edge1.id, edge1.name]])
    })
  })
})
