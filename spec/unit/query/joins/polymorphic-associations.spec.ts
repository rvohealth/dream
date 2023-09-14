import User from '../../../../test-app/app/models/User'
import Composition from '../../../../test-app/app/models/Composition'
import Rating from '../../../../test-app/app/models/Rating'
import Post from '../../../../test-app/app/models/Post'
import CannotJoinPolymorphicBelongsToError from '../../../../src/exceptions/associations/cannot-join-polymorphic-belongs-to-error'
import Query from '../../../../src/dream/query'
import HeartRating from '../../../../test-app/app/models/ExtraRating/HeartRating'
import { sql } from 'kysely'
import db from '../../../../src/db'
import dreamconf from '../../../../test-app/conf/dreamconf'

describe('Query#joins with polymorphic associations', () => {
  beforeEach(async () => {
    await sql`ALTER SEQUENCE compositions_id_seq RESTART 1;`.execute(db('primary', dreamconf))
    await sql`ALTER SEQUENCE posts_id_seq RESTART 1;`.execute(db('primary', dreamconf))
  })

  it('joins a HasMany association', async () => {
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })

    const composition = await Composition.create({ user })
    await Rating.create({ user, rateable: composition })

    // Two posts are necessary to create the conditions that resulted in the bug,
    // which happened because inner joining on an id is not aware of polyorphism,
    // so we needed to add the type condition (https://github.com/avocadojesus/dream/pull/110/files#diff-bf6ad57910dc74e01f45329e9e52af3124ce75719673d048aa955841534de7d7)
    await Post.create({ user })
    const post = await Post.create({ user })
    await Rating.create({ user, rateable: post })

    const reloaded = await new Query(Post).joins('ratings').all()
    expect(reloaded).toMatchDreamModels([post])
  })

  it('joins a HasMany association with STI', async () => {
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })

    const composition = await Composition.create({ user })
    await HeartRating.create({ user, extraRateable: composition })

    await Post.create({ user })
    const post = await Post.create({ user })
    await HeartRating.create({ user, extraRateable: post })

    const reloaded = await new Query(Post).joins('heartRatings').all()
    expect(reloaded).toMatchDreamModels([post])
  })

  it('from a BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const post = await Post.create({ user })
    const rating = await Rating.create({ user, rateable: post })

    await expect(Rating.limit(2).joins('rateable').first()).rejects.toThrowError(
      CannotJoinPolymorphicBelongsToError
    )
  })

  context('with a where clause', () => {
    it('joins a HasMany association', async () => {
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })

      const post = await Post.create({ user })
      const rating = await Rating.create({ user, rateable: post })

      const reloaded = await new Query(Post).joins('ratings', { id: rating.id }).first()
      expect(reloaded).toMatchDreamModel(post)

      const noResults = await new Query(Post)
        .joins('ratings', { id: parseInt(rating.id!.toString()) + 1 })
        .first()
      expect(noResults).toBeNull()
    })
  })
})
