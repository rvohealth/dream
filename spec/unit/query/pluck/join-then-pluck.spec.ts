import { DateTime } from '../../../../src/index.js'
import ops from '../../../../src/ops/index.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset.js'
import CompositionAssetAudit from '../../../../test-app/app/models/CompositionAssetAudit.js'
import Edge from '../../../../test-app/app/models/Graph/Edge.js'
import EdgeNode from '../../../../test-app/app/models/Graph/EdgeNode.js'
import Node from '../../../../test-app/app/models/Graph/Node.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import Post from '../../../../test-app/app/models/Post.js'
import PostComment from '../../../../test-app/app/models/PostComment.js'
import User from '../../../../test-app/app/models/User.js'

describe('Query#pluck on a join query', () => {
  it('can pluck from the associated namespace', async () => {
    const node = await Node.create({ name: 'N1' })
    const edge1 = await Edge.create({ name: 'E1' })
    const edge2 = await Edge.create({ name: 'E2' })
    await EdgeNode.create({ node, edge: edge1 })
    await EdgeNode.create({ node, edge: edge2 })

    const plucked = await Node.query()
      .innerJoin('edgeNodes', 'edge', { and: { name: 'E1' } })
      .pluck('edge.id', 'edge.name')
    expect(plucked).toEqual([[edge1.id, edge1.name]])
  })

  it('can use nestedSelect in a where clause', async () => {
    const node = await Node.create({ name: 'N1' })
    const edge1 = await Edge.create({ name: 'E1' })
    const edge2 = await Edge.create({ name: 'E2' })
    await EdgeNode.create({ node, edge: edge1 })
    await EdgeNode.create({ node, edge: edge2 })

    const plucked = await Node.query()
      .innerJoin('edgeNodes', 'edge', { and: { id: Edge.where({ name: 'E1' }).nestedSelect('id') } })
      .pluck('edge.id', 'edge.name')
    expect(plucked).toEqual([[edge1.id, edge1.name]])
  })

  it('can pluck from any associated namespace provided', async () => {
    const node = await Node.create({ name: 'N1' })
    const edge1 = await Edge.create({ name: 'E1' })
    const edge2 = await Edge.create({ name: 'E2' })
    await EdgeNode.create({ node, edge: edge1 })
    await EdgeNode.create({ node, edge: edge2 })

    const plucked = await Node.query()
      .innerJoin('edgeNodes', 'edge', { and: { name: 'E1' } })
      .pluck('edge.name', 'edgeNodes.position', 'graph_nodes.name')
    expect(plucked).toEqual([['E1', 1, 'N1']])
  })

  context('columns that get transformed during marshalling', () => {
    it('are properly marshalled', async () => {
      const node = await Node.create({ name: 'N1' })
      const edge1 = await Edge.create({ name: 'E1', weight: 2.3 })
      const edge2 = await Edge.create({ name: 'E2', weight: 7.1 })
      await EdgeNode.create({ node, edge: edge1 })
      await EdgeNode.create({ node, edge: edge2 })
      const plucked = await Node.query()
        .innerJoin('edgeNodes', 'edge', { and: { name: 'E1' } })
        .pluck('edge.weight')
      expect(plucked[0]).toEqual(2.3)
    })
  })

  it('association name after conditional', async () => {
    const node = await Node.create({ name: 'N1' })
    const edge1 = await Edge.create({ name: 'E1' })
    const edge2 = await Edge.create({ name: 'E2' })
    await EdgeNode.create({ node, edge: edge1 })
    await EdgeNode.create({ node, edge: edge2 })

    const plucked = await Node.query()
      .innerJoin('edgeNodes', { and: { edgeId: edge2.id } }, 'edge')
      .pluck('edge.id', 'edge.name')
    expect(plucked).toEqual([[edge2.id, edge2.name]])
  })

  context('with a similarity operator', () => {
    it('respects the similarity operator', async () => {
      const user1 = await User.create({ name: 'jeremy', email: 'hello@world1', password: 'howyadoin' })
      await Composition.create({ content: 'howyadoin', user: user1 })

      const user2 = await User.create({ name: 'cheeseman', email: 'hello@world2', password: 'howyadoin' })
      await Composition.create({ content: 'howyadoin', user: user2 })

      const plucked = await Composition.query()
        .innerJoin('user', { and: { name: ops.similarity('jerem') } })
        .pluck('user.id')
      expect(plucked).toEqual([user1.id])
    })
  })

  context('with a default scope', () => {
    it('applies the default scope to the included results', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Pet.create({ user, name: 'Snoopy' })
      await Pet.create({ user, name: 'Woodstock', deletedAt: DateTime.now() })
      const names = await User.query().innerJoin('pets').pluck('pets.name')
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
      const plucked = await CompositionAssetAudit.query().innerJoin('user').pluck('user.email')
      expect(plucked).toEqual(['fred@frewd'])
    })
  })

  context('implicit HasMany through', () => {
    let user: User
    let post: Post

    beforeEach(async () => {
      user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      post = await Post.create({ user })
      await PostComment.create({ post, body: 'hello world', deletedAt: DateTime.now() })
    })

    it('applies default scopes to the join model', async () => {
      expect(
        await User.where({ id: user.id }).innerJoin('postComments').pluck('postComments.body')
      ).toHaveLength(0)
    })

    it('respects removal of all default scopes', async () => {
      expect(
        await User.removeAllDefaultScopes()
          .where({ id: user.id })
          .innerJoin('postComments')
          .pluck('postComments.body')
      ).toEqual(['hello world'])
    })

    it('respects removal of named default scopes', async () => {
      expect(
        await User.removeDefaultScope('dream:SoftDelete')
          .where({ id: user.id })
          .innerJoin('postComments')
          .pluck('postComments.body')
      ).toEqual(['hello world'])
    })
  })

  context('explicit HasMany through', () => {
    let user: User
    let post: Post

    beforeEach(async () => {
      user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      post = await Post.create({ user })
      await PostComment.create({ post, body: 'hello world', deletedAt: DateTime.now() })
    })

    it('applies default scopes to the join model', async () => {
      expect(
        await User.where({ id: user.id }).innerJoin('posts', 'comments').pluck('comments.body')
      ).toHaveLength(0)
    })

    it('respects removal of all default scopes', async () => {
      expect(
        await User.removeAllDefaultScopes()
          .where({ id: user.id })
          .innerJoin('posts', 'comments')
          .pluck('comments.body')
      ).toEqual(['hello world'])
    })

    it('respects removal of named default scopes', async () => {
      expect(
        await User.removeDefaultScope('dream:SoftDelete')
          .where({ id: user.id })
          .innerJoin('posts', 'comments')
          .pluck('comments.body')
      ).toEqual(['hello world'])
    })
  })
})
