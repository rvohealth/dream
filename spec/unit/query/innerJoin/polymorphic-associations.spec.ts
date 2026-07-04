import { sql } from 'kysely'
import CannotJoinPolymorphicBelongsToError from '../../../../src/errors/associations/CannotJoinPolymorphicBelongsToError.js'
import ops from '../../../../src/ops/index.js'
import Balloon from '../../../../test-app/app/models/Balloon.js'
import Latex from '../../../../test-app/app/models/Balloon/Latex.js'
import Animal from '../../../../test-app/app/models/Balloon/Latex/Animal.js'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import HeartRating from '../../../../test-app/app/models/ExtraRating/HeartRating.js'
import Post from '../../../../test-app/app/models/Post.js'
import Rating from '../../../../test-app/app/models/Rating.js'
import User from '../../../../test-app/app/models/User.js'
import testDb from '../../../helpers/testDb.js'

describe('Query#joins with polymorphic associations', () => {
  beforeEach(async () => {
    await sql`ALTER SEQUENCE compositions_id_seq RESTART 1;`.execute(testDb('default', 'primary'))
    await sql`ALTER SEQUENCE posts_id_seq RESTART 1;`.execute(testDb('default', 'primary'))
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

  context('with an association provided as an argument to the and clause', () => {
    it('supports associations as clauses', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ user, content: 'hello' })
      const composition = await Composition.create({ user, content: 'goodbye' })
      await HeartRating.create({ extraRateable: composition, user })

      const composition2 = await Composition.create({ user, content: 'goodbye' })
      await HeartRating.create({ extraRateable: composition2, user })

      const reloaded = await User.query()
        .leftJoin('heartRatings', {
          and: { extraRateable: composition },
        })
        .firstOrFail()
      expect(reloaded).toMatchDreamModel(user)
    })

    context('with an array of polymorphic association instances of mixed types', () => {
      it('scopes each group of foreign keys to the type of its instances', async () => {
        const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user2 = await User.create({ email: 'fred2@frewd', password: 'howyadoin' })
        const user3 = await User.create({ email: 'fred3@frewd', password: 'howyadoin' })

        // the compositions and posts id sequences are restarted in this file's
        // beforeEach, so the composition and the post share the same id, proving
        // that the foreign key type scopes each group of foreign keys
        const composition = await Composition.create({ user: user1 })
        const post = await Post.create({ user: user2 })
        const composition2 = await Composition.create({ user: user3 })

        await Rating.create({ user: user1, rateable: composition })
        await Rating.create({ user: user2, rateable: post })
        await Rating.create({ user: user3, rateable: composition2 })

        const usersRatingTheComposition = await User.query()
          .innerJoin('ratings', { and: { rateable: [composition] } })
          .all()
        expect(usersRatingTheComposition).toMatchDreamModels([user1])

        const usersRatingEither = await User.query()
          .innerJoin('ratings', { and: { rateable: [composition, post] } })
          .all()
        expect(usersRatingEither).toMatchDreamModels([user1, user2])
      })
    })

    context('with an array of polymorphic association instances in an andNot clause', () => {
      it('negates the entire foreign key + type grouping', async () => {
        const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user2 = await User.create({ email: 'fred2@frewd', password: 'howyadoin' })
        const user3 = await User.create({ email: 'fred3@frewd', password: 'howyadoin' })

        // the compositions and posts id sequences are restarted in this file's
        // beforeEach, so the composition and the post share the same id; the
        // rating on the post must survive the negation despite the matching
        // foreign key because its type differs
        const composition = await Composition.create({ user: user1 })
        const post = await Post.create({ user: user2 })
        const composition2 = await Composition.create({ user: user3 })

        await Rating.create({ user: user1, rateable: composition })
        await Rating.create({ user: user2, rateable: post })
        await Rating.create({ user: user3, rateable: composition2 })

        const users = await User.query()
          .innerJoin('ratings', { andNot: { rateable: [composition] } })
          .all()
        expect(users).toMatchDreamModels([user2, user3])

        const usersNotRatingEither = await User.query()
          .innerJoin('ratings', { andNot: { rateable: [composition, post] } })
          .all()
        expect(usersNotRatingEither).toMatchDreamModels([user3])
      })
    })
  })

  context('when using a similarity operator to drill down results', () => {
    it('excludes records not matching similarity text', async () => {
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })

      const post = await Post.create({ user })
      await HeartRating.create({ user, extraRateable: post, body: 'hello' })

      const post2 = await Post.create({ user })
      await HeartRating.create({ user, extraRateable: post2, body: 'goodbye' })

      const reloaded = await Post.query()
        .innerJoin('heartRatings', { and: { body: ops.similarity('hello') } })
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

    await expect(
      Rating.limit(2)
        // @ts-expect-error joining a polymorphic BelongsTo is also forbidden at the type level
        .innerJoin('rateable')
        .first()
    ).rejects.toThrow(CannotJoinPolymorphicBelongsToError)
  })

  context('with a where clause', () => {
    it('joins a HasMany association', async () => {
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })

      const post = await Post.create({ user })
      const rating = await Rating.create({ user, rateable: post })

      const reloaded = await Post.query()
        .innerJoin('ratings', { and: { id: rating.id } })
        .first()
      expect(reloaded).toMatchDreamModel(post)

      const noResults = await Post.query()
        .innerJoin('ratings', { and: { id: (parseInt(rating.id.toString()) + 1).toString() } })
        .first()
      expect(noResults).toBeNull()
    })
  })
})
