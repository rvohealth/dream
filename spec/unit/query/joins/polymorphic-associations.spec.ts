import User from '../../../../test-app/app/models/user'
import Composition from '../../../../test-app/app/models/composition'
import CompositionAsset from '../../../../test-app/app/models/composition-asset'
import CompositionAssetAudit from '../../../../test-app/app/models/composition-asset-audit'
import Rating from '../../../../test-app/app/models/rating'
import Post from '../../../../test-app/app/models/post'
import CannotJoinPolymorphicBelongsToError from '../../../../src/exceptions/cannot-join-polymorphic-belongs-to-error'

describe('Query#joins with polymorphic associations', () => {
  it('joins a HasMany association', async () => {
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    await Composition.create({ user_id: user.id })
    await Post.create({ user_id: user.id })
    const post = await Post.create({ user_id: user.id })
    await Rating.create({ user_id: user.id, rateable_id: post.id, rateable_type: 'Post' })

    const reloaded = await Post.limit(3).joins('ratings').first()
    expect(reloaded).toMatchDreamModel(post)
  })

  it('from a BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const post = await Post.create({ user_id: user.id })
    const rating = await Rating.create({ user_id: user.id, rateable_id: post.id, rateable_type: 'Post' })

    await expect(Rating.limit(2).joins('rateable').first()).rejects.toThrowError(
      CannotJoinPolymorphicBelongsToError
    )
  })

  context('with a where clause', () => {
    it('joins a HasMany association', async () => {
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      await Composition.create({ user_id: user.id })
      const post = await Post.create({ user_id: user.id })
      const rating = await Rating.create({ user_id: user.id, rateable_id: post.id, rateable_type: 'Post' })

      const reloaded = await Post.limit(3)
        .joins('ratings')
        .where({ ratings: { id: rating.id } })
        .first()
      expect(reloaded).toMatchDreamModel(post)

      const noResults = await Post.limit(3)
        .joins('ratings')
        .where({ ratings: { id: rating.id + 1 } })
        .first()
      expect(noResults).toBeNull()
    })
  })
})
