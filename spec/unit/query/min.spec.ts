import Composition from '../../../test-app/app/models/Composition'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'
import Post from '../../../test-app/app/models/Post'
import Rating from '../../../test-app/app/models/Rating'
import User from '../../../test-app/app/models/User'
import ops from '../../../src/ops'

describe('Query#min', () => {
  it('returns the record with the lowest value', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
    const post1 = await Post.create({ user, body: 'universe' })
    await Post.create({ user, body: 'world' })
    await Post.create({ user, body: 'world' })

    const min = await Post.min('id')
    expect(min).toEqual(post1.id)
  })

  context('with a where statement passed', () => {
    context('with a similarity operator passed', () => {
      it('respects the similarity operator', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        await Post.create({ user, body: 'universe' })
        const post2 = await Post.create({ user, body: 'world' })
        await Post.create({ user, body: 'world' })

        const min = await Post.where({ body: ops.similarity('world') }).min('id')

        expect(min).toEqual(post2.id)
      })
    })
  })

  context('hasMany', () => {
    it('returns the min', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      await CompositionAsset.create({ composition, score: 7 })
      await CompositionAsset.create({ composition, score: 3 })

      const min = await composition.associationQuery('compositionAssets').min('score')

      expect(min).toEqual(3)
    })

    context('polymorphic hasMany', () => {
      it('returns the min', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })

        const post1 = await Post.create({ user })
        const post2 = await Post.create({ user })

        await Rating.create({ user, rateable: post1, rating: 3 })
        await Rating.create({ user, rateable: post1, rating: 4 })
        await Rating.create({ user, rateable: post2, rating: 1 })
        await Rating.create({ user, rateable: post1, rating: 2 })

        const min = await post1.associationQuery('ratings').min('rating')

        expect(min).toEqual(2)
      })
    })
  })

  context('hasMany through', () => {
    it('returns the min', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition1 = await Composition.create({ user })
      const composition2 = await Composition.create({ user })

      await CompositionAsset.create({ composition: composition1, score: 7 })
      await CompositionAsset.create({ composition: composition2, score: 3 })

      const min = await user.associationQuery('compositionAssets').min('score')

      expect(min).toEqual(3)
    })
  })
})
