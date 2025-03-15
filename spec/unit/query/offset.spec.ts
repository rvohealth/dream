import ops from '../../../src/ops.js'
import Composition from '../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset.js'
import Post from '../../../test-app/app/models/Post.js'
import Rating from '../../../test-app/app/models/Rating.js'
import User from '../../../test-app/app/models/User.js'

describe('Query#offset', () => {
  it('applies offset to results', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
    const user3 = await User.create({ email: 'chalupas@dujour', password: 'howyadoin' })

    const records = await User.order('id').limit(2).offset(1).all()
    expect(records).toMatchDreamModels([user2, user3])
  })

  context('with a where statement passed', () => {
    context('with a similarity operator passed', () => {
      it('respects the similarity operator', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        await Post.create({ user, body: 'universe' })
        await Post.create({ user, body: 'world' })
        const post3 = await Post.create({ user, body: 'world' })

        const results = await Post.where({ body: ops.similarity('world') })
          .limit(1)
          .offset(1)
          .all()

        expect(results).toMatchDreamModels([post3])
      })
    })
  })

  context('hasMany', () => {
    it('applies offset to results', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      await CompositionAsset.create({ composition, score: 7 })
      const compositionAsset2 = await CompositionAsset.create({ composition, score: 3 })

      const results = await composition.associationQuery('compositionAssets').limit(1).offset(1).all()
      expect(results).toMatchDreamModels([compositionAsset2])
    })

    context('polymorphic hasMany', () => {
      it('applies offset to results', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })

        const post1 = await Post.create({ user })

        await Rating.create({ user, rateable: post1, rating: 3 })
        const rating2 = await Rating.create({ user, rateable: post1, rating: 4 })
        const rating3 = await Rating.create({ user, rateable: post1, rating: 1 })

        const results = await post1.associationQuery('ratings').limit(2).offset(1).all()
        expect(results).toMatchDreamModels([rating2, rating3])
      })
    })

    context('hasMany through', () => {
      it('applies offset to results', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        const composition1 = await Composition.create({ user })
        const composition2 = await Composition.create({ user })

        await CompositionAsset.create({ composition: composition1, score: 7 })
        const compositionAsset2 = await CompositionAsset.create({ composition: composition2, score: 3 })

        const results = await user.associationQuery('compositionAssets').limit(1).offset(1).all()
        expect(results).toMatchDreamModels([compositionAsset2])
      })
    })
  })
})
