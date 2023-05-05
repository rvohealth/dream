import User from '../../../../test-app/app/models/User'
import Composition from '../../../../test-app/app/models/Composition'
import Post from '../../../../test-app/app/models/Post'
import Rating from '../../../../test-app/app/models/Rating'

describe('Query#includes with polymorphic associations', () => {
  it('loads a HasMany association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await Composition.create({ user_id: user.id })
    const post = await Post.create({ user_id: user.id })
    const rating = await Rating.create({ user_id: user.id, rateable_id: post.id, rateable_type: 'Rating' })

    const reloaded = await Post.limit(3).includes('ratings').first()
    expect(reloaded!.ratings).toMatchDreamModels([rating])
  })

  it('loads a HasOne association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await Composition.create({ user_id: user.id })
    const post = await Post.create({ user_id: user.id })
    await Rating.create({ user_id: user.id, rateable_id: post.id, rateable_type: 'Post' })

    const reloaded = await Rating.limit(3).includes('rateable').first()
    expect(reloaded!.rateable).toMatchDreamModel(post)
  })

  it('loads a BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await Composition.create({ user_id: user.id })
    const post = await Post.create({ user_id: user.id })
    await Rating.create({ user_id: user.id, rateable_id: post.id, rateable_type: 'Post' })

    const reloaded = await Rating.limit(3).includes('rateable').first()
    expect(reloaded!.rateable).toMatchDreamModel(post)
  })
})
