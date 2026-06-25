import { DateTime } from '../../../../../src/utils/datetime/DateTime.js'
import MissingRequiredBelongsToAssociation from '../../../../../src/errors/associations/MissingRequiredBelongsToAssociation.js'
import Post from '../../../../../test-app/app/models/Post.js'
import Rating from '../../../../../test-app/app/models/Rating.js'
import User from '../../../../../test-app/app/models/User.js'

describe('missing required BelongsTo associations', () => {
  context('non-polymorphic BelongsTo', () => {
    it('throws a clear exception when a required association is loaded as null', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const post = await Post.create({ user })

      const reloadedPost = await Post.findOrFail(post.id)
      ;(reloadedPost as any).__user__ = null

      expect(reloadedPost.loaded('user')).toBe(true)
      expect(() => reloadedPost.user).toThrow(MissingRequiredBelongsToAssociation)
      expect(() => reloadedPost.user).toThrow('foreign key `userId` is set to')
    })
  })

  context('polymorphic BelongsTo', () => {
    it('throws a clear exception when a required association record is missing', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const post = await Post.create({ user, deletedAt: DateTime.now() })
      const rating = await Rating.create({ user, rateable: post })

      const reloadedRating = await Rating.preload('rateable').findOrFail(rating.id)

      expect(reloadedRating.loaded('rateable')).toBe(true)
      expect(() => reloadedRating.rateable).toThrow(MissingRequiredBelongsToAssociation)
      expect(() => reloadedRating.rateable).toThrow('foreign key `rateableId` is set to')
      expect(() => reloadedRating.rateable).toThrow('polymorphic type field `rateableType` is set to')
      expect(() => reloadedRating.rateable).toThrow("dependent: 'destroy'")
    })
  })
})
