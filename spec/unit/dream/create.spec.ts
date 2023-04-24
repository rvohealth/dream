import Composition from '../../../test-app/app/models/composition'
import Post from '../../../test-app/app/models/post'
import Rating from '../../../test-app/app/models/rating'
import User from '../../../test-app/app/models/user'
import UserSettings from '../../../test-app/app/models/user-settings'
import CanOnlyPassBelongsToModelParam from '../../../src/exceptions/can-only-pass-belongs-to-model-param'

describe('Dream.create', () => {
  it('creates the underlying model in the db', async () => {
    const u = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.find(u.id)
    expect(user!.email).toEqual('fred@frewd')
    expect(typeof user!.id).toBe('number')
  })

  context('passed a model to a BelongsTo association', () => {
    it('sets the foreign key on this object', async () => {
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      expect(composition.user_id).toEqual(user.id)
      const reloadedComposition = await Composition.find(composition.id)
      expect(reloadedComposition!.user_id).toEqual(user.id)
    })

    it('sets the reference to that model', async () => {
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      expect(composition.user).toEqual(user)
    })

    context('when the model is polymorphic', () => {
      it('sets the foreign key and foreign key type on this object', async () => {
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const post = await Post.create({ user })
        const rating = await Rating.create({ user, rateable: post })

        expect(rating.rateable_id).toEqual(post.id)
        expect(rating.rateable_type).toEqual('Post')
        const reloadedRating = await Rating.find(rating.id)
        expect(reloadedRating!.rateable_id).toEqual(post.id)
        expect(reloadedRating!.rateable_type).toEqual('Post')
      })

      it('sets the reference to that model', async () => {
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const post = await Post.create({ user })
        const rating = await Rating.create({ user, rateable: post })

        expect(rating.rateable).toEqual(post)
      })
    })
  })

  context('passed a model to a HasOne association', () => {
    it('raises an exception', async () => {
      const userSettings = new UserSettings({ likes_chalupas: true })
      await expect(
        // @ts-ignore
        async () => await User.create({ email: 'fred@fishman', password: 'howyadoin', userSettings })
      ).rejects.toThrowError(CanOnlyPassBelongsToModelParam)
    })
  })

  // context('passed a model to a HasOne through association', () => {
  // })
})
