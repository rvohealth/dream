import { sql } from 'kysely'
import CannotJoinPolymorphicBelongsToError from '../../../../src/errors/associations/CannotJoinPolymorphicBelongsToError.js'
import ops from '../../../../src/ops/index.js'
import Balloon from '../../../../test-app/app/models/Balloon.js'
import Latex from '../../../../test-app/app/models/Balloon/Latex.js'
import Animal from '../../../../test-app/app/models/Balloon/Latex/Animal.js'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import HeartRating from '../../../../test-app/app/models/ExtraRating/HeartRating.js'
import Chore from '../../../../test-app/app/models/Polymorphic/Chore.js'
import PolymorphicMetaUser from '../../../../test-app/app/models/Polymorphic/MetaUser.js'
import PolymorphicTask from '../../../../test-app/app/models/Polymorphic/Task.js'
import PolymorphicUser from '../../../../test-app/app/models/Polymorphic/User.js'
import PolymorphicUserMetaUser from '../../../../test-app/app/models/Polymorphic/UserMetaUser.js'
import Workout from '../../../../test-app/app/models/Polymorphic/Workout.js'
import Post from '../../../../test-app/app/models/Post.js'
import Rating from '../../../../test-app/app/models/Rating.js'
import User from '../../../../test-app/app/models/User.js'
import testDb from '../../../helpers/testDb.js'

const sortRows = (rows: unknown[][]) =>
  [...rows].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))

describe('Query#leftJoin with polymorphic associations', () => {
  beforeEach(async () => {
    await sql`ALTER SEQUENCE compositions_id_seq RESTART 1;`.execute(testDb('default', 'primary'))
    await sql`ALTER SEQUENCE posts_id_seq RESTART 1;`.execute(testDb('default', 'primary'))
  })

  it('joins a HasMany association, keeping parents without a matching row', async () => {
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })

    const composition = await Composition.create({ user })
    await Rating.create({ user, rateable: composition })

    // Two posts are necessary to create the conditions that resulted in the bug,
    // which happened because joining on an id is not aware of polyorphism,
    // so we needed to add the type condition (https://github.com/avocadojesus/dream/pull/110/files#diff-bf6ad57910dc74e01f45329e9e52af3124ce75719673d048aa955841534de7d7).
    // The compositions and posts id sequences are restarted in this file's beforeEach,
    // so the composition shares its id with the first (unrated) post; without the type
    // condition, the composition's rating would be attached to that post.
    const unratedPost = await Post.create({ user })
    const post = await Post.create({ user })
    const rating = await Rating.create({ user, rateable: post })

    const reloaded = await Post.query().leftJoin('ratings').all()
    expect(reloaded).toMatchDreamModels([unratedPost, post])

    const rows = await Post.query().leftJoin('ratings').order('id').pluck('id', 'ratings.id')
    expect(rows).toEqual([
      [unratedPost.id, null],
      [post.id, rating.id],
    ])
  })

  it('joins a HasMany association with STI, keeping parents without a matching row', async () => {
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })

    const composition = await Composition.create({ user })
    await HeartRating.create({ user, extraRateable: composition })

    const unratedPost = await Post.create({ user })
    const post = await Post.create({ user })
    const heartRating = await HeartRating.create({ user, extraRateable: post })

    const reloaded = await Post.query().leftJoin('heartRatings').all()
    expect(reloaded).toMatchDreamModels([unratedPost, post])

    const rows = await Post.query().leftJoin('heartRatings').order('id').pluck('id', 'heartRatings.id')
    expect(rows).toEqual([
      [unratedPost.id, null],
      [post.id, heartRating.id],
    ])
  })

  context('with an association provided as an argument to the and clause', () => {
    it('supports associations as clauses', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ user, content: 'hello' })
      const composition = await Composition.create({ user, content: 'goodbye' })
      const heartRating = await HeartRating.create({ extraRateable: composition, user })

      const composition2 = await Composition.create({ user, content: 'goodbye' })
      await HeartRating.create({ extraRateable: composition2, user })

      const reloaded = await User.query()
        .leftJoin('heartRatings', {
          and: { extraRateable: composition },
        })
        .firstOrFail()
      expect(reloaded).toMatchDreamModel(user)

      const heartRatingIds = await User.query()
        .leftJoin('heartRatings', {
          and: { extraRateable: composition },
        })
        .pluck('heartRatings.id')
      expect(heartRatingIds).toEqual([heartRating.id])
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

        const rating1 = await Rating.create({ user: user1, rateable: composition })
        const rating2 = await Rating.create({ user: user2, rateable: post })
        await Rating.create({ user: user3, rateable: composition2 })

        const usersRatingTheComposition = await User.query()
          .leftJoin('ratings', { and: { rateable: [composition] } })
          .all()
        expect(usersRatingTheComposition).toMatchDreamModels([user1, user2, user3])

        const ratingsOfTheComposition = await User.query()
          .leftJoin('ratings', { and: { rateable: [composition] } })
          .order('id')
          .pluck('id', 'ratings.id')
        expect(ratingsOfTheComposition).toEqual([
          [user1.id, rating1.id],
          [user2.id, null],
          [user3.id, null],
        ])

        const ratingsOfEither = await User.query()
          .leftJoin('ratings', { and: { rateable: [composition, post] } })
          .order('id')
          .pluck('id', 'ratings.id')
        expect(ratingsOfEither).toEqual([
          [user1.id, rating1.id],
          [user2.id, rating2.id],
          [user3.id, null],
        ])
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
        const rating2 = await Rating.create({ user: user2, rateable: post })
        const rating3 = await Rating.create({ user: user3, rateable: composition2 })

        const users = await User.query()
          .leftJoin('ratings', { andNot: { rateable: [composition] } })
          .all()
        expect(users).toMatchDreamModels([user1, user2, user3])

        const ratingsNotOfTheComposition = await User.query()
          .leftJoin('ratings', { andNot: { rateable: [composition] } })
          .order('id')
          .pluck('id', 'ratings.id')
        expect(ratingsNotOfTheComposition).toEqual([
          [user1.id, null],
          [user2.id, rating2.id],
          [user3.id, rating3.id],
        ])

        const ratingsNotOfEither = await User.query()
          .leftJoin('ratings', { andNot: { rateable: [composition, post] } })
          .order('id')
          .pluck('id', 'ratings.id')
        expect(ratingsNotOfEither).toEqual([
          [user1.id, null],
          [user2.id, null],
          [user3.id, rating3.id],
        ])
      })
    })
  })

  context('when using a similarity operator to drill down results', () => {
    // Skipped: ops.similarity in a leftJoin and-clause is currently ignored. The similarity
    // builder (KyselyQueryDriver#similarityStatementBuilder) only consults innerJoinAndStatements,
    // so the trigram condition never reaches the left join. This spec documents the expected
    // behavior once leftJoin and-statements are wired into the similarity builder.
    it.skip('nulls out joined rows not matching similarity text', async () => {
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })

      const post = await Post.create({ user })
      const heartRating = await HeartRating.create({ user, extraRateable: post, body: 'hello' })

      const post2 = await Post.create({ user })
      await HeartRating.create({ user, extraRateable: post2, body: 'goodbye' })

      const reloaded = await Post.query()
        .leftJoin('heartRatings', { and: { body: ops.similarity('hello') } })
        .all()
      expect(reloaded).toMatchDreamModels([post, post2])

      const rows = await Post.query()
        .leftJoin('heartRatings', { and: { body: ops.similarity('hello') } })
        .order('id')
        .pluck('id', 'heartRatings.id')
      expect(rows).toEqual([
        [post.id, heartRating.id],
        [post2.id, null],
      ])
    })
  })

  context('when joining a polymorphic HasMany from an STI class', () => {
    it('joins associations for all STI models, keeping those without a matching row', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const mylar = await Mylar.create({ user })
      const latex = await Latex.create({ user })
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

      const balloons = await Balloon.leftJoin('heartRatings').all()
      expect(balloons).toMatchDreamModels([mylar, latex, animal])

      const rows = await Balloon.leftJoin('heartRatings').order('id').pluck('id', 'heartRatings.rating')
      expect(rows).toEqual([
        [mylar.id, 7],
        [latex.id, null],
        [animal.id, 8],
      ])
    })
  })

  it('from a BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const post = await Post.create({ user })
    await Rating.create({ user, rateable: post })

    await expect(
      Rating.limit(2)
        // @ts-expect-error joining a polymorphic BelongsTo is also forbidden at the type level
        .leftJoin('rateable')
        .first()
    ).rejects.toThrow(CannotJoinPolymorphicBelongsToError)
  })

  context(
    'and-clause on a through association whose source is itself a through association with a polymorphic source',
    () => {
      it('applies the and clause to the collapsed polymorphic target', async () => {
        const user = await PolymorphicUser.create({ name: 'Mountain Dew' })
        const metaUser = await PolymorphicMetaUser.create({ name: 'Meta Do' })
        await PolymorphicUserMetaUser.create({ polymorphicUser: user, polymorphicMetaUser: metaUser })
        // a meta user without any chores is still returned, with a null chore
        const choreLessMetaUser = await PolymorphicMetaUser.create({ name: 'Meta Don’t' })

        const sweepChore = await Chore.create({ name: 'sweep' })
        const dishesChore = await Chore.create({ name: 'dishes' })
        // a workout with the matching name must still be excluded by the polymorphic type condition
        const sweepWorkout = await Workout.create({ name: 'sweep' })
        await PolymorphicTask.create({ user, taskable: sweepChore })
        await PolymorphicTask.create({ user, taskable: dishesChore })
        await PolymorphicTask.create({ user, taskable: sweepWorkout })

        // the intermediate joins are unconditioned left joins, so the meta user yields one
        // row per task, and only the row for the sweep chore carries a chore id
        const rows = await PolymorphicMetaUser.query()
          .leftJoin('choresNamedSweep')
          .pluck('id', 'choresNamedSweep.id')
        expect(sortRows(rows)).toEqual(
          sortRows([
            [metaUser.id, sweepChore.id],
            [metaUser.id, null],
            [metaUser.id, null],
            [choreLessMetaUser.id, null],
          ])
        )
      })
    }
  )

  context('with a where clause', () => {
    it('joins a HasMany association, keeping the parent when nothing matches', async () => {
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })

      const post = await Post.create({ user })
      const rating = await Rating.create({ user, rateable: post })

      const reloaded = await Post.query()
        .leftJoin('ratings', { and: { id: rating.id } })
        .first()
      expect(reloaded).toMatchDreamModel(post)

      const nonMatchingId = (parseInt(rating.id.toString()) + 1).toString()
      const stillReloaded = await Post.query()
        .leftJoin('ratings', { and: { id: nonMatchingId } })
        .first()
      expect(stillReloaded).toMatchDreamModel(post)

      const ratingIds = await Post.query()
        .leftJoin('ratings', { and: { id: nonMatchingId } })
        .pluck('ratings.id')
      expect(ratingIds).toEqual([null])
    })
  })
})
