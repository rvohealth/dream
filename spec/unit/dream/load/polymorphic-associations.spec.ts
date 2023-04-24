import User from '../../../../test-app/app/models/user'
import Composition from '../../../../test-app/app/models/composition'
import Post from '../../../../test-app/app/models/post'
import Rating from '../../../../test-app/app/models/rating'

describe('Dream#load with polymorphic associations', () => {
  it('loads a HasMany association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await Composition.create({ user_id: user.id })
    const post = await Post.create({ user_id: user.id })
    const rating = await Rating.create({ user_id: user.id, rateable_id: post.id, rateable_type: 'Rating' })

    await post.load('ratings')
    expect(post.ratings).toMatchDreamModels([rating])
  })

  it('loads a HasOne association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await Composition.create({ user_id: user.id })
    const post = await Post.create({ user_id: user.id })
    const rating = await Rating.create({ user_id: user.id, rateable_id: post.id, rateable_type: 'Post' })

    await rating.load('rateable')
    expect(rating.rateable).toMatchObject(post)
  })

  it('loads a BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await Composition.create({ user_id: user.id })
    const post = await Post.create({ user_id: user.id })
    const rating = await Rating.create({ user_id: user.id, rateable_id: post.id, rateable_type: 'Post' })

    await rating.load('rateable')
    expect(rating.rateable).toMatchObject(post)
  })
})
