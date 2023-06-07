import Query from '../../../src/dream/query'
import Composition from '../../../test-app/app/models/Composition'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'
import Post from '../../../test-app/app/models/Post'
import Rating from '../../../test-app/app/models/Rating'
import User from '../../../test-app/app/models/User'

describe('Query#max', () => {
  describe('hasMany', () => {
    it('returns the max', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      const compositionAsset1 = await CompositionAsset.create({ composition, score: 7 })
      const compositionAsset2 = await CompositionAsset.create({ composition, score: 3 })

      const query = composition.queryAssociation('compositionAssets') as Query<typeof CompositionAsset>
      const max = await query.max('score')

      expect(max).toEqual(7)
    })
  })

  describe('hasMany through', () => {
    it('returns the max', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition1 = await Composition.create({ user })
      const composition2 = await Composition.create({ user })

      const compositionAsset1 = await CompositionAsset.create({ composition: composition1, score: 7 })
      const compositionAsset2 = await CompositionAsset.create({ composition: composition2, score: 3 })

      const query = user.queryAssociation('compositionAssets') as Query<typeof CompositionAsset>
      const max = await query.max('score')

      expect(max).toEqual(7)
    })
  })

  it('returns the max', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })

    const post1 = await Post.create({ user })
    const post2 = await Post.create({ user })

    const rating1 = await Rating.create({ user, rateable: post1, rating: 3 })
    const rating2 = await Rating.create({ user, rateable: post1, rating: 4 })
    const rating3 = await Rating.create({ user, rateable: post2, rating: 5 })
    const rating4 = await Rating.create({ user, rateable: post1, rating: 2 })

    const query = post1.queryAssociation('ratings') as Query<typeof Rating>
    const max = await query.max('rating')

    expect(max).toEqual(4)
  })
})
