import { sql } from 'kysely'
import { DateTime } from '../../../../src/index.js'
import Balloon from '../../../../test-app/app/models/Balloon.js'
import Latex from '../../../../test-app/app/models/Balloon/Latex.js'
import Animal from '../../../../test-app/app/models/Balloon/Latex/Animal.js'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import HeartRating from '../../../../test-app/app/models/ExtraRating/HeartRating.js'
import NonNullRating from '../../../../test-app/app/models/NonNullRating.js'
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
        expect(reloaded!.rateable).toBeNull()

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
        expect(reloaded.rateable).toBeNull()

        const unscopedReloaded = await Rating.preload('rateableEvenIfDeleted', 'user').findOrFail(rating.id)
        expect(unscopedReloaded.rateableEvenIfDeleted.user).toMatchDreamModel(user)
      })
    })
  })
})
