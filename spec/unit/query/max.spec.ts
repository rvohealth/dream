import ops from '../../../src/ops'
import Composition from '../../../test-app/app/models/Composition'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'
import Post from '../../../test-app/app/models/Post'
import Rating from '../../../test-app/app/models/Rating'
import User from '../../../test-app/app/models/User'

describe('Query#max', () => {
  it('returns the record with the highest value', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
    await Post.create({ user, body: 'universe' })
    await Post.create({ user, body: 'world' })
    const post3 = await Post.create({ user, body: 'world' })

    const max = await Post.max('id')
    expect(max).toEqual(post3.id)
  })

  context('with a where statement passed', () => {
    context('with a similarity operator passed', () => {
      it('respects the similarity operator', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        await Post.create({ user, body: 'universe' })
        await Post.create({ user, body: 'world' })
        const post3 = await Post.create({ user, body: 'world' })

        const max = await Post.where({ body: ops.similarity('world') }).max('id')

        expect(max).toEqual(post3.id)
      })
    })
  })

  context('hasMany', () => {
    it('returns the max', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      await CompositionAsset.create({ composition, score: 7 })
      await CompositionAsset.create({ composition, score: 3 })

      const max = await composition.associationQuery('compositionAssets').max('score')

      expect(max).toEqual(7)
    })

    context('with a polymorphic association', () => {
      it('returns the max', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })

        const post1 = await Post.create({ user })
        const post2 = await Post.create({ user })

        await Rating.create({ user, rateable: post1, rating: 3 })
        await Rating.create({ user, rateable: post1, rating: 4 })
        await Rating.create({ user, rateable: post2, rating: 5 })
        await Rating.create({ user, rateable: post1, rating: 2 })

        const max = await post1.associationQuery('ratings').max('rating')

        expect(max).toEqual(4)
      })
    })
  })

  context('hasMany through', () => {
    it('returns the max', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition1 = await Composition.create({ user })
      const composition2 = await Composition.create({ user })

      await CompositionAsset.create({ composition: composition1, score: 7 })
      await CompositionAsset.create({ composition: composition2, score: 3 })

      const max = await user.associationQuery('compositionAssets').max('score')

      expect(max).toEqual(7)
    })
  })
})
