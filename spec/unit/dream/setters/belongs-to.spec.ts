import Composition from '../../../../test-app/app/models/Composition'
import Post from '../../../../test-app/app/models/Post'
import Rating from '../../../../test-app/app/models/Rating'
import User from '../../../../test-app/app/models/User'

describe('BelongsTo setters', () => {
  it('the getter is updated to the new model', async () => {
    const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
    const otherUser = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ user })

    composition.user = otherUser
    expect(composition.user).toMatchDreamModel(otherUser)
  })

  it('updates the foreign key', async () => {
    const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
    const otherUser = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ user })
    composition.user = otherUser

    expect(composition.user_id).toEqual(otherUser.id)
  })

  it('the original foreign key is stored in the changedAttributes foreign key', async () => {
    const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
    const otherUser = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ user })
    composition.user = otherUser

    expect(composition.changedAttributes()).toEqual({ user_id: user.id })
  })

  context('polymorphic', () => {
    it('updates the foreign key and the type', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      const post = await Post.create({ user })
      const rating = await Rating.create({ user, rateable: composition })
      rating.rateable = post

      expect(rating.rateable_id).toEqual(post.id)
      expect(rating.rateable_type).toEqual('Post')
    })

    it('the original foreign key and type are stored in the changedAttributes foreign key and type', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      const post = await Post.create({ user })
      const rating = await Rating.create({ user, rateable: composition })
      rating.rateable = post

      expect(rating.changedAttributes()).toEqual({
        rateable_id: composition.id,
        rateable_type: 'Composition',
      })
    })
  })
})
