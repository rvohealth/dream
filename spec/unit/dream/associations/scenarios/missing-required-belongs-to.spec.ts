import { DateTime } from '../../../../../src/utils/datetime/DateTime.js'
import MissingRequiredBelongsToAssociation from '../../../../../src/errors/associations/MissingRequiredBelongsToAssociation.js'
import Post from '../../../../../test-app/app/models/Post.js'
import Rating from '../../../../../test-app/app/models/Rating.js'
import User from '../../../../../test-app/app/models/User.js'

function errorThrownBy(callback: () => void): Error {
  try {
    callback()
  } catch (error) {
    if (error instanceof Error) return error
    throw error
  }

  throw new Error('Expected callback to throw')
}

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
      const error = errorThrownBy(() => reloadedPost.user)
      expect(error.message).toEqual(`
Attempting to access required BelongsTo association \`user\` on an instance of \`Post\`,
but the loaded association is null.

The foreign key \`userId\` is set to \`${reloadedPost.userId}\`, but no associated record was loaded.

The associated record may have been deleted (including soft-deleted), or it may not match this association’s target—for example, its STI type may differ from the targeted STI child. If the record was deleted unexpectedly, check whether the inverse HasOne/HasMany association should specify \`dependent: 'destroy'\`.
`)
    })

    it('retains the null-key diagnosis without populated-key advice', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const post = await Post.create({ user })

      const reloadedPost = await Post.findOrFail(post.id)
      ;(reloadedPost as any).__user__ = null
      ;(reloadedPost as any).userId = null

      const error = errorThrownBy(() => reloadedPost.user)
      expect(error).toBeInstanceOf(MissingRequiredBelongsToAssociation)
      expect(error.message).toEqual(`
Attempting to access required BelongsTo association \`user\` on an instance of \`Post\`,
but the loaded association is null.

The foreign key \`userId\` is null, which violates this non-optional BelongsTo association.
`)
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
      const error = errorThrownBy(() => reloadedRating.rateable)
      expect(error.message).toEqual(`
Attempting to access required BelongsTo association \`rateable\` on an instance of \`Rating\`,
but the loaded association is null.

The foreign key \`rateableId\` is set to \`${reloadedRating.rateableId}\`, but no associated record was loaded.
The polymorphic type field \`rateableType\` is set to \`${reloadedRating.rateableType}\`.

The associated record may have been deleted (including soft-deleted), or it may not match this association’s target—for example, its STI type may differ from the targeted STI child. If the record was deleted unexpectedly, check whether the inverse HasOne/HasMany association should specify \`dependent: 'destroy'\`.
`)
    })
  })
})
