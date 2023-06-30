import User from '../../../../test-app/app/models/User'
import Composition from '../../../../test-app/app/models/Composition'
import Rating from '../../../../test-app/app/models/Rating'
import Post from '../../../../test-app/app/models/Post'
import CannotJoinPolymorphicBelongsToError from '../../../../src/exceptions/cannot-join-polymorphic-belongs-to-error'
import Query from '../../../../src/dream/query'
import HeartRating from '../../../../test-app/app/models/ExtraRating/HeartRating'

describe('Query#joins with polymorphic associations', () => {
  it('joins a HasMany association', async () => {
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    await Composition.create({ user })
    await Post.create({ user })
    const post = await Post.create({ user })
    await Rating.create({ user, rateable: post })

    const reloaded = await new Query(Post).joins('ratings').first()
    expect(reloaded).toMatchDreamModel(post)
  })

  it('joins a HasMany association with STI', async () => {
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    await Composition.create({ user })
    await Post.create({ user })
    const post = await Post.create({ user })
    await HeartRating.create({ user, extraRateable: post })

    const reloaded = await new Query(Post).joins('heartRatings').first()
    expect(reloaded).toMatchDreamModel(post)
  })

  it('from a BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user })
    const post = await Post.create({ user })
    const rating = await Rating.create({ user, rateable: post })

    await expect(Rating.limit(2).joins('rateable').first()).rejects.toThrowError(
      CannotJoinPolymorphicBelongsToError
    )
  })

  context('with a where clause', () => {
    it('joins a HasMany association', async () => {
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      await Composition.create({ user })
      const post = await Post.create({ user })
      const rating = await Rating.create({ user, rateable: post })

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
