import User from '../../../../test-app/app/models/User'
import Composition from '../../../../test-app/app/models/Composition'
import Post from '../../../../test-app/app/models/Post'
import Rating from '../../../../test-app/app/models/Rating'
import HeartRating from '../../../../test-app/app/models/ExtraRating/HeartRating'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar'
import Latex from '../../../../test-app/app/models/Balloon/Latex'
import Animal from '../../../../test-app/app/models/Balloon/Latex/Animal'
import Balloon from '../../../../test-app/app/models/Balloon'

describe('Query#preload with polymorphic associations', () => {
  it('loads a HasMany association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await Composition.create({ user })
    const post = await Post.create({ user })
    const rating = await Rating.create({ user, rateable: post })

    const reloaded = await Post.where({ id: post.id }).preload('ratings').first()
    expect(reloaded!.ratings).toMatchDreamModels([rating])
  })

  it('loads a HasMany association with STI', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await Composition.create({ user })
    const post = await Post.create({ user })
    const heartRating = await HeartRating.create({ user, extraRateable: post })

    const reloaded = await Post.where({ id: post.id }).preload('heartRatings').first()
    expect(reloaded!.heartRatings).toMatchDreamModels([heartRating])
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

      const reloadedMylar = balloons[0] as Mylar
      expect(reloadedMylar).toMatchDreamModel(mylar)
      expect(reloadedMylar.heartRatings).toMatchDreamModels([mylarHeartRating])

      const reloadedLatex = balloons[1] as Latex
      expect(reloadedLatex).toMatchDreamModel(latex)
      expect(reloadedLatex.heartRatings).toMatchDreamModels([latexHeartRating])

      const reloadedAnimal = balloons[2] as Animal
      expect(reloadedAnimal).toMatchDreamModel(animal)
      expect(reloadedAnimal.heartRatings).toMatchDreamModels([animalHeartRating])
    })
  })

  it('loads a BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await Composition.create({ user })
    const post = await Post.create({ user })
    const rating = await Rating.create({ user, rateable: post })

    const reloaded = await Rating.where({ id: rating.id }).preload('rateable').first()
    expect(reloaded!.rateable).toMatchDreamModel(post)
  })
})
