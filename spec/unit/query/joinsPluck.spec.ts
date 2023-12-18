import { DateTime } from 'luxon'
import Node from '../../../test-app/app/models/Graph/Node'
import Edge from '../../../test-app/app/models/Graph/Edge'
import EdgeNode from '../../../test-app/app/models/Graph/EdgeNode'
import ops from '../../../src/ops'
import Query from '../../../src/dream/query'
import User from '../../../test-app/app/models/User'
import Composition from '../../../test-app/app/models/Composition'
import Pet from '../../../test-app/app/models/Pet'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'
import CompositionAssetAudit from '../../../test-app/app/models/CompositionAssetAudit'

describe('Query#joinsPluck', () => {
  it('can pluck from the associated namespace', async () => {
    const node = await Node.create({ name: 'N1' })
    const edge1 = await Edge.create({ name: 'E1' })
    const edge2 = await Edge.create({ name: 'E2' })
    await EdgeNode.create({ node, edge: edge1 })
    await EdgeNode.create({ node, edge: edge2 })

    const plucked = await new Query(Node).joinsPluck('edgeNodes', 'edge', { name: 'E1' }, [
      'edge.id',
      'edge.name',
    ])
    expect(plucked).toEqual([[edge1.id, edge1.name]])
  })

  it('association name after conditional', async () => {
    const node = await Node.create({ name: 'N1' })
    const edge1 = await Edge.create({ name: 'E1' })
    const edge2 = await Edge.create({ name: 'E2' })
    await EdgeNode.create({ node, edge: edge1 })
    await EdgeNode.create({ node, edge: edge2 })

    const plucked = await new Query(Node).joinsPluck('edgeNodes', { edgeId: edge2.id }, 'edge', [
      'edge.id',
      'edge.name',
    ])
    expect(plucked).toEqual([[edge2.id, edge2.name]])
  })

  context('with a similarity operator', () => {
    it('respects the similarity operator', async () => {
      const user1 = await User.create({ name: 'jeremy', email: 'hello@world1', password: 'howyadoin' })
      const composition1 = await Composition.create({ content: 'howyadoin', user: user1 })

      const user2 = await User.create({ name: 'cheeseman', email: 'hello@world2', password: 'howyadoin' })
      const composition2 = await Composition.create({ content: 'howyadoin', user: user2 })

      const plucked = await new Query(Composition).joinsPluck('user', { name: ops.similarity('jerem') }, [
        'user.id',
      ])
      expect(plucked).toEqual([user1.id])
    })
  })

  context('with a default scope', () => {
    it('applies the default scope to the included results', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const snoopy = await Pet.create({ user, name: 'Snoopy' })
      await Pet.create({ user, name: 'Woodstock', deletedAt: DateTime.now() })

      const names = await User.joinsPluck('pets', 'pets.name')
      expect(names).toEqual(['Snoopy'])
    })
  })

  context('nested through associations', () => {
    it('plucks from the through associations', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      const compositionAsset = await CompositionAsset.create({ composition })
      await CompositionAssetAudit.create({
        compositionAssetId: compositionAsset.id,
      })

      const plucked = await new Query(CompositionAssetAudit).joinsPluck('user', 'user.email')
      expect(plucked).toEqual(['fred@frewd'])
    })
  })
})
