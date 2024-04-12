import { DateTime } from 'luxon'
import Node from '../../../test-app/app/models/Graph/Node'
import Edge from '../../../test-app/app/models/Graph/Edge'
import EdgeNode from '../../../test-app/app/models/Graph/EdgeNode'
import ops from '../../../src/ops'
import User from '../../../test-app/app/models/User'
import Composition from '../../../test-app/app/models/Composition'
import Pet from '../../../test-app/app/models/Pet'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'
import CompositionAssetAudit from '../../../test-app/app/models/CompositionAssetAudit'

describe('Query#pluckThrough', () => {
  it('can pluck from the associated namespace', async () => {
    const node = await Node.create({ name: 'N1' })
    const edge1 = await Edge.create({ name: 'E1' })
    const edge2 = await Edge.create({ name: 'E2' })
    await EdgeNode.create({ node, edge: edge1 })
    await EdgeNode.create({ node, edge: edge2 })

    const plucked = await Node.query().pluckThrough('edgeNodes', 'edge', { name: 'E1' }, [
      'edge.id',
      'edge.name',
    ])
    expect(plucked).toEqual([[edge1.id, edge1.name]])
  })

  it('can use nestedSelect in a where clause', async () => {
    const node = await Node.create({ name: 'N1' })
    const edge1 = await Edge.create({ name: 'E1' })
    const edge2 = await Edge.create({ name: 'E2' })
    await EdgeNode.create({ node, edge: edge1 })
    await EdgeNode.create({ node, edge: edge2 })

    const plucked = await Node.query().pluckThrough(
      'edgeNodes',
      'edge',
      { id: Edge.where({ name: 'E1' }).nestedSelect('id') },
      ['edge.id', 'edge.name']
    )
    expect(plucked).toEqual([[edge1.id, edge1.name]])
  })

  context('columns that get transformed during marshalling', () => {
    it('are properly marshalled', async () => {
      const node = await Node.create({ name: 'N1' })
      const edge1 = await Edge.create({ name: 'E1', weight: 2.3 })
      const edge2 = await Edge.create({ name: 'E2', weight: 7.1 })
      await EdgeNode.create({ node, edge: edge1 })
      await EdgeNode.create({ node, edge: edge2 })

      const plucked = await Node.query().pluckThrough('edgeNodes', 'edge', { name: 'E1' }, 'edge.weight')
      expect(plucked[0]).toEqual(2.3)
    })
  })

  it('association name after conditional', async () => {
    const node = await Node.create({ name: 'N1' })
    const edge1 = await Edge.create({ name: 'E1' })
    const edge2 = await Edge.create({ name: 'E2' })
    await EdgeNode.create({ node, edge: edge1 })
    await EdgeNode.create({ node, edge: edge2 })

    const plucked = await Node.query().pluckThrough('edgeNodes', { edgeId: edge2.id }, 'edge', [
      'edge.id',
      'edge.name',
    ])
    expect(plucked).toEqual([[edge2.id, edge2.name]])
  })

  context('with a similarity operator', () => {
    it('respects the similarity operator', async () => {
      const user1 = await User.create({ name: 'jeremy', email: 'hello@world1', password: 'howyadoin' })
      await Composition.create({ content: 'howyadoin', user: user1 })

      const user2 = await User.create({ name: 'cheeseman', email: 'hello@world2', password: 'howyadoin' })
      await Composition.create({ content: 'howyadoin', user: user2 })

      const plucked = await Composition.query().pluckThrough('user', { name: ops.similarity('jerem') }, [
        'user.id',
      ])
      expect(plucked).toEqual([user1.id])
    })
  })

  context('with a default scope', () => {
    it('applies the default scope to the included results', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Pet.create({ user, name: 'Snoopy' })
      await Pet.create({ user, name: 'Woodstock', deletedAt: DateTime.now() })

      const names = await User.pluckThrough('pets', 'pets.name')
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

      const plucked = await CompositionAssetAudit.query().pluckThrough('user', 'user.email')
      expect(plucked).toEqual(['fred@frewd'])
    })
  })

  // this is skipped, since it is only here to ensure that types are working
  // from args a-g, which does not actually need to be run, since if this is
  // broken, tests will fail to compile due to type errors
  it.skip('permits types a-g', async () => {
    await Node.query().pluckThrough('edgeNodes', 'edge', 'edgeNodes', 'edge', 'edgeNodes', 'edge', [
      'edge.id',
    ])
  })
})
