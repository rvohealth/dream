import User from '../../../../test-app/app/models/User'
import Composition from '../../../../test-app/app/models/Composition'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import CompositionAssetAudit from '../../../../test-app/app/models/CompositionAssetAudit'
import Rating from '../../../../test-app/app/models/Rating'
import Post from '../../../../test-app/app/models/Post'
import CannotJoinPolymorphicBelongsToError from '../../../../src/exceptions/cannot-join-polymorphic-belongs-to-error'
import Query from '../../../../src/dream/query'

describe('Query#joins with polymorphic associations', () => {
  it('joins a HasMany association', async () => {
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    await Composition.create({ user_id: user.id })
    await Post.create({ user_id: user.id })
    const post = await Post.create({ user_id: user.id })
    await Rating.create({ user_id: user.id, rateable_id: post.id, rateable_type: 'Post' })

    const reloaded = await new Query(Post).joins('ratings').first()
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

      const reloaded = await new Query(Post)
        .joins('ratings')
        .where({ ratings: { id: rating.id } })
        .first()
      expect(reloaded).toMatchDreamModel(post)

      const noResults = await new Query(Post)
        .joins('ratings')
        .where({ ratings: { id: parseInt(rating.id!.toString()) + 1 } })
        .first()
      expect(noResults).toBeNull()
    })
  })
})
