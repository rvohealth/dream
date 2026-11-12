import { sql } from 'kysely'
import { DateTime } from '../../../../src/utils/datetime/DateTime.js'
import MissingRequiredBelongsToAssociation from '../../../../src/errors/associations/MissingRequiredBelongsToAssociation.js'
import Balloon from '../../../../test-app/app/models/Balloon.js'
import Latex from '../../../../test-app/app/models/Balloon/Latex.js'
import Animal from '../../../../test-app/app/models/Balloon/Latex/Animal.js'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import HeartRating from '../../../../test-app/app/models/ExtraRating/HeartRating.js'
import NonNullRating from '../../../../test-app/app/models/NonNullRating.js'
import ops from '../../../../src/ops/index.js'
import Post from '../../../../test-app/app/models/Post.js'
import Rating from '../../../../test-app/app/models/Rating.js'
import User from '../../../../test-app/app/models/User.js'
import testDb from '../../../helpers/testDb.js'

describe('Query#preload with polymorphic associations', () => {
  beforeEach(async () => {
    await sql`ALTER SEQUENCE compositions_id_seq RESTART 1;`.execute(testDb('default', 'primary'))
    await sql`ALTER SEQUENCE posts_id_seq RESTART 1;`.execute(testDb('default', 'primary'))
  })

  context('HasMany', () => {
    it('loads a HasMany association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      await Rating.create({ user, rateable: composition })
      const post = await Post.create({ user })
      const postRating = await Rating.create({ user, rateable: post })

      const reloaded = await Post.where({ id: post.id }).preload('ratings').first()
      expect(reloaded!.ratings).toMatchDreamModels([postRating])
    })

    it('supports where clauses', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      await Rating.create({ user, rateable: composition })
      const post = await Post.create({ user })
      await Rating.create({ user, rateable: post, rating: 3 })
      const postRating = await Rating.create({ user, rateable: post, rating: 7 })

      const reloaded = await Post.where({ id: post.id })
        .preload('ratings', { and: { rating: 7 } })
        .first()
      expect(reloaded!.ratings).toMatchDreamModels([postRating])
    })

    it('supports arrays of polymorphic association instances in and clauses on the preload', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      // the compositions and posts id sequences are restarted in this file's
      // beforeEach, so the composition and the post share the same id, proving
      // that the foreign key type scopes each group of foreign keys
      const composition = await Composition.create({ user })
      const post = await Post.create({ user })

      const compositionRating = await Rating.create({ user, rateable: composition })
      const postRating = await Rating.create({ user, rateable: post })

      const reloaded = await User.where({ id: user.id })
        .preload('ratings', { and: { rateable: [composition] } })
        .firstOrFail()
      expect(reloaded.ratings).toMatchDreamModels([compositionRating])

      const reloadedWithBoth = await User.where({ id: user.id })
        .preload('ratings', { and: { rateable: [composition, post] } })
        .firstOrFail()
      expect(reloadedWithBoth.ratings).toMatchDreamModels([compositionRating, postRating])
    })

    it('loads a HasMany association with STI', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ user })
      const post = await Post.create({ user })
      const heartRating = await HeartRating.create({ user, extraRateable: post })

      const reloaded = await Post.where({ id: post.id }).preload('heartRatings').first()
      expect(reloaded!.heartRatings).toMatchDreamModels([heartRating])
    })

    context('through', () => {
      it('loads the associated object', async () => {
        const user = await User.create({
          email: 'fred@frewd',
          password: 'howyadoin',
          featuredPostPosition: 2,
        })

        const post1 = await Post.create({ user })
        const rating1 = await Rating.create({ user, rateable: post1 })
        const post2 = await Post.create({ user })
        const rating2 = await Rating.create({ user, rateable: post2 })

        const reloadedUser = await User.query().preload('ratings').first()
        expect(reloadedUser!.ratings).toMatchDreamModels([rating1, rating2])
      })
    })

    context('when loading a polymorphic HasMany from an STI class', () => {
      it('loads associations for all STI models', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

        const mylar = await Mylar.create({ user })
        const latex = await Latex.create({ user })
        const animal = await Animal.create({ user })

        const mylarHeartRating = await HeartRating.create({
          user,
          extraRateable: mylar,
          rating: 7,
        })

        const latexHeartRating = await HeartRating.create({
          user,
          extraRateable: latex,
          rating: 2,
        })

        const animalHeartRating = await HeartRating.create({
          user,
          extraRateable: animal,
          rating: 8,
        })

        const balloons = await Balloon.preload('heartRatings').all()

        const reloadedMylar = balloons.find(obj => obj.type === 'Mylar') as Mylar
        expect(reloadedMylar).toMatchDreamModel(mylar)
        expect(reloadedMylar.heartRatings).toMatchDreamModels([mylarHeartRating])

        const reloadedLatex = balloons.find(obj => obj.type === 'Latex') as Latex
        expect(reloadedLatex).toMatchDreamModel(latex)
        expect(reloadedLatex.heartRatings).toMatchDreamModels([latexHeartRating])

        const reloadedAnimal = balloons.find(obj => obj.type === 'Animal') as Animal
        expect(reloadedAnimal).toMatchDreamModel(animal)
        expect(reloadedAnimal.heartRatings).toMatchDreamModels([animalHeartRating])
      })
    })

    context('withoutDefaultScopes', () => {
      it('applies the default scope exclusions to the underlying query', async () => {
        const user = await User.create({
          email: 'fred@frewd',
          password: 'howyadoin',
        })
        await Composition.create({ user })
        const post = await Post.create({ user })
        const rating = await NonNullRating.create({ user, rateable: post })

        const reloaded = await Post.preload('overriddenNonNullRatings', 'user').findOrFail(post.id)

        expect(await NonNullRating.count()).toEqual(0)
        expect(reloaded.overriddenNonNullRatings[0]).toMatchDreamModel(rating)
        expect(reloaded.overriddenNonNullRatings[0]!.user).toMatchDreamModel(user)
      })
    })
  })

  context('BelongsTo association', () => {
    context('with conditions on the preload', () => {
      let user: User
      let otherUser: User
      let post: Post
      let composition: Composition
      let postRating: Rating
      let compositionRating: Rating

      beforeEach(async () => {
        user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        otherUser = await User.create({ email: 'frewd@fred', password: 'howyadoin' })
        post = await Post.create({ user })
        composition = await Composition.create({ user: otherUser })
        postRating = await Rating.create({ user, rateable: post })
        compositionRating = await Rating.create({ user, rateable: composition })
      })

      // constraining a required BelongsTo is a compile-time error by design, so these
      // specs use the optional polymorphic associations declared on the test-app models
      it('applies and clauses to every polymorphic target', async () => {
        const reloaded = await Rating.where({ id: [postRating.id, compositionRating.id] })
          .preload('optionalRateable', { and: { userId: user.id } })
          .order('id')
          .all()

        expect(reloaded[0]!.optionalRateable).toMatchDreamModel(post)
        expect(reloaded[1]!.optionalRateable).toBeNull()
      })

      it('applies andNot clauses to every polymorphic target', async () => {
        const reloaded = await Rating.where({ id: [postRating.id, compositionRating.id] })
          .preload('optionalRateable', { andNot: { userId: user.id } })
          .order('id')
          .all()

        expect(reloaded[0]!.optionalRateable).toBeNull()
        expect(reloaded[1]!.optionalRateable).toMatchDreamModel(composition)
      })

      it('applies andAny clauses to every polymorphic target', async () => {
        const reloaded = await Rating.where({ id: [postRating.id, compositionRating.id] })
          .preload('optionalRateable', { andAny: [{ userId: user.id }, { userId: otherUser.id }] })
          .order('id')
          .all()

        expect(reloaded[0]!.optionalRateable).toMatchDreamModel(post)
        expect(reloaded[1]!.optionalRateable).toMatchDreamModel(composition)

        const partiallyReloaded = await Rating.where({ id: [postRating.id, compositionRating.id] })
          .preload('optionalRateable', { andAny: [{ userId: user.id }, { id: 0 }] })
          .order('id')
          .all()

        expect(partiallyReloaded[0]!.optionalRateable).toMatchDreamModel(post)
        expect(partiallyReloaded[1]!.optionalRateable).toBeNull()
      })

      context('when the conditions reference the primary key of the polymorphic target', () => {
        let unrelatedPost: Post
        let unrelatedComposition: Composition

        beforeEach(async () => {
          unrelatedPost = await Post.create({ user })
          unrelatedComposition = await Composition.create({ user })
        })

        it('cannot widen an and clause beyond the rows the association points to', async () => {
          const reloaded = await Rating.where({ id: [postRating.id, compositionRating.id] })
            .preload('optionalRateable', { and: { id: unrelatedPost.id } })
            .order('id')
            .all()

          expect(reloaded[0]!.optionalRateable).toBeNull()
          expect(reloaded[1]!.optionalRateable).toBeNull()
        })

        it('cannot widen an andAny clause beyond the rows the association points to', async () => {
          const reloaded = await Rating.where({ id: [postRating.id, compositionRating.id] })
            .preload('optionalRateable', {
              andAny: [{ id: unrelatedPost.id }, { id: unrelatedComposition.id }],
            })
            .order('id')
            .all()

          expect(reloaded[0]!.optionalRateable).toBeNull()
          expect(reloaded[1]!.optionalRateable).toBeNull()
        })

        it('still narrows to the associated row when the condition names it', async () => {
          // `post` and `composition` share the same id (see this file's beforeEach), so the
          // condition also names the user to single out the post
          const reloaded = await Rating.where({ id: [postRating.id, compositionRating.id] })
            .preload('optionalRateable', {
              andAny: [{ id: post.id, userId: user.id }, { id: unrelatedPost.id }],
            })
            .order('id')
            .all()

          expect(reloaded[0]!.optionalRateable).toMatchDreamModel(post)
          expect(reloaded[1]!.optionalRateable).toBeNull()
        })

        it('never attaches a row to a Dream whose foreign key type does not match it', async () => {
          // the compositions and posts id sequences are restarted in this file's
          // beforeEach, so `post` and `composition` share the same id: a condition
          // naming that id must still hydrate each Dream with the row of its own type
          expect(post.id).toEqual(composition.id)

          const reloaded = await Rating.where({ id: [postRating.id, compositionRating.id] })
            .preload('optionalRateable', { and: { id: post.id } })
            .order('id')
            .all()

          expect(reloaded[0]!.optionalRateable).toMatchDreamModel(post)
          expect(reloaded[1]!.optionalRateable).toMatchDreamModel(composition)
        })
      })

      it('supports ops.any in and clauses against an array column on the polymorphic target', async () => {
        const greenBalloon = await Mylar.create({ user, multicolor: ['green'] })
        const blueBalloon = await Mylar.create({ user, multicolor: ['blue'] })
        const greenRating = await HeartRating.create({ user, extraRateable: greenBalloon })
        const blueRating = await HeartRating.create({ user, extraRateable: blueBalloon })

        const reloaded = await HeartRating.where({ id: [greenRating.id, blueRating.id] })
          .preload('optionalExtraRateable', { and: { multicolor: ops.any('green') } })
          .order('id')
          .all()

        expect(reloaded[0]!.optionalExtraRateable).toMatchDreamModel(greenBalloon)
        expect(reloaded[1]!.optionalExtraRateable).toBeNull()
      })

      it('supports ops.any in andAny clauses combined with a null check', async () => {
        const greenBalloon = await Mylar.create({ user, multicolor: ['green'] })
        const blueBalloon = await Mylar.create({ user, multicolor: ['blue'] })
        const uncoloredBalloon = await Mylar.create({ user, multicolor: null })
        const greenRating = await HeartRating.create({ user, extraRateable: greenBalloon })
        const blueRating = await HeartRating.create({ user, extraRateable: blueBalloon })
        const uncoloredRating = await HeartRating.create({ user, extraRateable: uncoloredBalloon })

        const reloaded = await HeartRating.where({ id: [greenRating.id, blueRating.id, uncoloredRating.id] })
          .preload('optionalExtraRateable', {
            andAny: [{ multicolor: null }, { multicolor: ops.any('green') }],
          })
          .order('id')
          .all()

        expect(reloaded[0]!.optionalExtraRateable).toMatchDreamModel(greenBalloon)
        expect(reloaded[1]!.optionalExtraRateable).toBeNull()
        expect(reloaded[2]!.optionalExtraRateable).toMatchDreamModel(uncoloredBalloon)
      })
    })

    it('loads', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ user })
      const post = await Post.create({ user })
      const rating = await Rating.create({ user, rateable: post })

      const reloaded = await Rating.where({ id: rating.id }).preload('rateable').first()
      expect(reloaded!.rateable).toMatchDreamModel(post)
    })

    context('removeAllDefaultScopes', () => {
      it('loads otherwise-hidden through associations', async () => {
        const user = await User.create({
          email: 'fred@frewd',
          password: 'howyadoin',
          deletedAt: DateTime.now(),
        })
        await Composition.create({ user })
        const post = await Post.create({ user, deletedAt: DateTime.now() })
        const rating = await Rating.create({ user, rateable: post })

        const reloaded = await Rating.preload('rateable', 'user').find(rating.id)
        expect(() => reloaded!.rateable).toThrow(MissingRequiredBelongsToAssociation)

        const unscopedReloaded = await Rating.removeAllDefaultScopes()
          .preload('rateable', 'user')
          .find(rating.id)
        expect(unscopedReloaded!.rateable.user).toMatchDreamModel(user)
      })
    })

    context('withoutDefaultScopes', () => {
      it('applies the default scope exclusions to the underlying query', async () => {
        const user = await User.create({
          email: 'fred@frewd',
          password: 'howyadoin',
        })
        await Composition.create({ user })
        const post = await Post.create({ user, deletedAt: DateTime.now() })
        const rating = await Rating.create({ user, rateable: post })

        const reloaded = await Rating.preload('rateable', 'user').findOrFail(rating.id)
        expect(() => reloaded.rateable).toThrow(MissingRequiredBelongsToAssociation)

        const unscopedReloaded = await Rating.preload('rateableEvenIfDeleted', 'user').findOrFail(rating.id)
        expect(unscopedReloaded.rateableEvenIfDeleted.user).toMatchDreamModel(user)
      })
    })
  })

  context(
    'with associations that are only supported on one or another of a polymorphic model association',
    () => {
      it('allows all associations to be preloaded', async () => {
        const user = await User.create({
          email: 'fred@frewd',
          password: 'howyadoin',
        })
        await Composition.create({ user })
        const post = await Post.create({ user })
        const rating = await Rating.create({ user, rateable: post })
        const comment = await post.createAssociation('comments')

        const reloaded = await Rating.preload('rateable', ['compositionAssets', 'comments']).findOrFail(
          rating.id
        )
        expect((reloaded.rateable as Post).comments).toMatchDreamModels([comment])
      })

      context('when traveling through a polymorphic association to its descendants', () => {
        it('allows all associations to be preloaded', async () => {
          const user = await User.create({
            email: 'fred@frewd',
            password: 'howyadoin',
          })
          await Post.create({ user })
          const composition = await Composition.create({ user })
          const compositionAsset = await composition.createAssociation('compositionAssets')
          const compositionAssetAudit = await compositionAsset.createAssociation('compositionAssetAudits')
          const rating = await Rating.create({ user, rateable: composition })

          const reloaded = await Rating.preload(
            'rateable',
            'compositionAssets',
            'compositionAssetAudits'
          ).findOrFail(rating.id)
          expect(
            (reloaded.rateable as Composition).compositionAssets[0]!.compositionAssetAudits
          ).toMatchDreamModels([compositionAssetAudit])
        })
      })

      context('when aliasing an association on the other side of the polymorphic association', () => {
        it('loads the aliased association and continues the chain through it', async () => {
          const user = await User.create({
            email: 'fred@frewd',
            password: 'howyadoin',
          })
          await Composition.create({ user })
          const post = await Post.create({ user })
          const rating = await Rating.create({ user, rateable: post })
          const comment = await post.createAssociation('comments')

          const reloaded = await Rating.preload('rateable', 'comments as c', 'post').findOrFail(rating.id)
          expect((reloaded.rateable as Post).comments).toMatchDreamModels([comment])
          expect((reloaded.rateable as Post).comments[0]!.post).toMatchDreamModel(post)
        })
      })
    }
  )
})

it.skip('type test', async () => {
  // preload allows re-using of association names since preloading does not occur within a single
  // query, so will not result in namespace collision
  await Rating.preload('rateable', ['compositionAssets', 'comments']).all()
  await Rating.preload('rateable', 'comments').all()

  // @ts-expect-error type test
  await Rating.preload('rateable', ['compositionAssets', 'commentz']).all()

  // @ts-expect-error type test
  await Rating.preload('rateable', 'commentz').all()

  // @ts-expect-error type test
  Rating.preload('rateable', 'comments', 'compositionAssetAudits')

  // @ts-expect-error type test
  Rating.preload('rateable', 'compositionAssets', 'post')
})
