import { sql } from 'kysely'
import db from '../../../../src/db'
import CannotJoinPolymorphicBelongsToError from '../../../../src/errors/associations/CannotJoinPolymorphicBelongsToError'
import ops from '../../../../src/ops'
import Balloon from '../../../../test-app/app/models/Balloon'
import Latex from '../../../../test-app/app/models/Balloon/Latex'
import Animal from '../../../../test-app/app/models/Balloon/Latex/Animal'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar'
import Composition from '../../../../test-app/app/models/Composition'
import HeartRating from '../../../../test-app/app/models/ExtraRating/HeartRating'
import Post from '../../../../test-app/app/models/Post'
import Rating from '../../../../test-app/app/models/Rating'
import User from '../../../../test-app/app/models/User'

describe('Query#joins with polymorphic associations', () => {
  beforeEach(async () => {
    await sql`ALTER SEQUENCE compositions_id_seq RESTART 1;`.execute(db('primary'))
    await sql`ALTER SEQUENCE posts_id_seq RESTART 1;`.execute(db('primary'))
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

    const reloaded = await Post.query().innerJoin('ratings').all()
    expect(reloaded).toMatchDreamModels([post])
  })

  it('joins a HasMany association with STI', async () => {
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })

    const composition = await Composition.create({ user })
    await HeartRating.create({ user, extraRateable: composition })

    await Post.create({ user })
    const post = await Post.create({ user })
    await HeartRating.create({ user, extraRateable: post })

    const reloaded = await Post.query().innerJoin('heartRatings').all()
    expect(reloaded).toMatchDreamModels([post])
  })

  context('when using a similarity operator to drill down results', () => {
    it('excludes records not matching similarity text', async () => {
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })

      const post = await Post.create({ user })
      await HeartRating.create({ user, extraRateable: post, body: 'hello' })

      const post2 = await Post.create({ user })
      await HeartRating.create({ user, extraRateable: post2, body: 'goodbye' })

      const reloaded = await Post.query()
        .innerJoin('heartRatings', { on: { body: ops.similarity('hello') } })
        .all()

      expect(reloaded).toMatchDreamModels([post])
    })
  })

  context('when joining a polymorphic HasMany from an STI class', () => {
    it('joins associations for all STI models', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const mylar = await Mylar.create({ user })
      await Latex.create({ user })
      const animal = await Animal.create({ user })

      await HeartRating.create({
        user,
        extraRateable: mylar,
        rating: 7,
      })

      await HeartRating.create({
        user,
        extraRateable: animal,
        rating: 8,
      })

      const balloons = await Balloon.innerJoin('heartRatings').all()
      expect(balloons).toMatchDreamModels([mylar, animal])
    })
  })

  it('from a BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const post = await Post.create({ user })
    await Rating.create({ user, rateable: post })

    await expect(Rating.limit(2).innerJoin('rateable').first()).rejects.toThrow(
      CannotJoinPolymorphicBelongsToError
    )
  })

  context('with a where clause', () => {
    it('joins a HasMany association', async () => {
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })

      const post = await Post.create({ user })
      const rating = await Rating.create({ user, rateable: post })

      const reloaded = await Post.query()
        .innerJoin('ratings', { on: { id: rating.id } })
        .first()
      expect(reloaded).toMatchDreamModel(post)

      const noResults = await Post.query()
        .innerJoin('ratings', { on: { id: parseInt(rating.id.toString()) + 1 } })
        .first()
      expect(noResults).toBeNull()
    })
  })
})
