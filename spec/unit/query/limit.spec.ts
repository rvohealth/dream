import Post from '../../../test-app/app/models/Post'
import User from '../../../test-app/app/models/User'
import ops from '../../../src/ops'
import Composition from '../../../test-app/app/models/Composition'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'
import Rating from '../../../test-app/app/models/Rating'

describe('Query#limit', () => {
  it('limits number of records returned', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const records = await User.order('id').limit(2).all()
    expect(records[0].id).toEqual(user1.id)
    expect(records[1].id).toEqual(user2.id)
  })

  context('with a where statement passed', () => {
    context('with a similarity operator passed', () => {
      it('respects the similarity operator', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        await Post.create({ user, body: 'universe' })
        const post2 = await Post.create({ user, body: 'world' })
        await Post.create({ user, body: 'world' })

        const results = await Post.where({ body: ops.similarity('world') })
          .limit(1)
          .all()

        expect(results).toMatchDreamModels([post2])
      })
    })
  })

  context('hasMany', () => {
    it('limits results', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      const compositionAsset1 = await CompositionAsset.create({ composition, score: 7 })
      await CompositionAsset.create({ composition, score: 3 })

      const results = await composition.associationQuery('compositionAssets').limit(1).all()
      expect(results).toMatchDreamModels([compositionAsset1])
    })

    context('polymorphic hasMany', () => {
      it('limits results', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })

        const post1 = await Post.create({ user })

        const rating1 = await Rating.create({ user, rateable: post1, rating: 3 })
        const rating2 = await Rating.create({ user, rateable: post1, rating: 4 })
        await Rating.create({ user, rateable: post1, rating: 1 })

        const results = await post1.associationQuery('ratings').limit(2).all()
        expect(results).toMatchDreamModels([rating1, rating2])
      })
    })

    context('hasMany through', () => {
      it('limits results', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        const composition1 = await Composition.create({ user })
        const composition2 = await Composition.create({ user })

        const compositionAsset1 = await CompositionAsset.create({ composition: composition1, score: 7 })
        await CompositionAsset.create({ composition: composition2, score: 3 })

        const results = await user.associationQuery('compositionAssets').limit(1).all()
        expect(results).toMatchDreamModels([compositionAsset1])
      })
    })
  })
})
