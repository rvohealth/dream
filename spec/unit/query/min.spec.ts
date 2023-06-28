import Query from '../../../src/dream/query'
import Composition from '../../../test-app/app/models/Composition'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'
import Post from '../../../test-app/app/models/Post'
import Rating from '../../../test-app/app/models/Rating'
import User from '../../../test-app/app/models/User'

describe('Query#min', () => {
  describe('hasMany', () => {
    it('returns the min', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      const compositionAsset1 = await CompositionAsset.create({ composition, score: 7 })
      const compositionAsset2 = await CompositionAsset.create({ composition, score: 3 })

      const min = await composition.associationQuery('compositionAssets').min('score')

      expect(min).toEqual(3)
    })
  })

  describe('hasMany through', () => {
    it('returns the min', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition1 = await Composition.create({ user })
      const composition2 = await Composition.create({ user })

      const compositionAsset1 = await CompositionAsset.create({ composition: composition1, score: 7 })
      const compositionAsset2 = await CompositionAsset.create({ composition: composition2, score: 3 })

      const min = await user.associationQuery('compositionAssets').min('score')

      expect(min).toEqual(3)
    })
  })

  it('returns the min', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })

    const post1 = await Post.create({ user })
    const post2 = await Post.create({ user })

    const rating1 = await Rating.create({ user, rateable: post1, rating: 3 })
    const rating2 = await Rating.create({ user, rateable: post1, rating: 4 })
    const rating3 = await Rating.create({ user, rateable: post2, rating: 1 })
    const rating4 = await Rating.create({ user, rateable: post1, rating: 2 })

    const min = await post1.associationQuery('ratings').min('rating')

    expect(min).toEqual(2)
  })
})
