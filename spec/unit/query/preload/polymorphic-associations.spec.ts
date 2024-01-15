import { sql } from 'kysely'
import db from '../../../../src/db'
import dreamconf from '../../../../test-app/conf/dreamconf'
import User from '../../../../test-app/app/models/User'
import Composition from '../../../../test-app/app/models/Composition'
import Post from '../../../../test-app/app/models/Post'
import Rating from '../../../../test-app/app/models/Rating'
import HeartRating from '../../../../test-app/app/models/ExtraRating/HeartRating'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar'
import Latex from '../../../../test-app/app/models/Balloon/Latex'
import Animal from '../../../../test-app/app/models/Balloon/Latex/Animal'
import Balloon from '../../../../test-app/app/models/Balloon'
import { DateTime } from 'luxon'

describe('Query#preload with polymorphic associations', () => {
  beforeEach(async () => {
    await sql`ALTER SEQUENCE compositions_id_seq RESTART 1;`.execute(db('primary', dreamconf))
    await sql`ALTER SEQUENCE posts_id_seq RESTART 1;`.execute(db('primary', dreamconf))
  })

  it('loads a HasMany association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user })
    const compositionRating = await Rating.create({ user, rateable: composition })
    const post = await Post.create({ user })
    const postRating = await Rating.create({ user, rateable: post })

    const reloaded = await Post.where({ id: post.id }).preload('ratings').first()
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

  context('BelongsTo association', () => {
    it('loads', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ user })
      const post = await Post.create({ user })
      const rating = await Rating.create({ user, rateable: post })

      const reloaded = await Rating.where({ id: rating.id }).preload('rateable').first()
      expect(reloaded!.rateable).toMatchDreamModel(post)
    })

    context('unscoped', () => {
      it('cascades through associations', async () => {
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

        const unscopedReloaded = await Rating.unscoped().preload('rateable', 'user').find(rating.id)
        expect(unscopedReloaded!.rateable.user).toMatchDreamModel(user)
      })
    })
  })
})
