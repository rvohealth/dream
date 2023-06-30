import User from '../../../../test-app/app/models/User'
import Composition from '../../../../test-app/app/models/Composition'
import Post from '../../../../test-app/app/models/Post'
import Rating from '../../../../test-app/app/models/Rating'
import HeartRating from '../../../../test-app/app/models/ExtraRating/HeartRating'

describe('Query#includes with polymorphic associations', () => {
  it('loads a HasMany association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await Composition.create({ user })
    const post = await Post.create({ user })
    const rating = await Rating.create({ user, rateable: post })

    const reloaded = await Post.where({ id: post.id }).includes('ratings').first()
    expect(reloaded!.ratings).toMatchDreamModels([rating])
  })

  it('loads a HasMany association with STI', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await Composition.create({ user })
    const post = await Post.create({ user })
    const heartRating = await HeartRating.create({ user, extraRateable: post })

    const reloaded = await Post.where({ id: post.id }).includes('heartRatings').first()
    expect(reloaded!.heartRatings).toMatchDreamModels([heartRating])
  })

  it('loads a BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await Composition.create({ user })
    const post = await Post.create({ user })
    const rating = await Rating.create({ user, rateable: post })

    const reloaded = await Rating.where({ id: rating.id }).includes('rateable').first()
    expect(reloaded!.rateable).toMatchDreamModel(post)
  })
})
