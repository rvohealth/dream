import Composition from '../../../test-app/app/models/composition'
import Post from '../../../test-app/app/models/post'
import Rating from '../../../test-app/app/models/rating'
import User from '../../../test-app/app/models/user'
import UserSettings from '../../../test-app/app/models/user-settings'
import CanOnlyPassBelongsToModelParam from '../../../src/exceptions/can-only-pass-belongs-to-model-param'
import Pet from '../../../test-app/app/models/pet'
import { DateTime } from 'luxon'

describe('Dream.create', () => {
  it('creates the underlying model in the db', async () => {
    const u = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.find(u.id)
    expect(user!.email).toEqual('fred@frewd')
    expect(typeof user!.id).toBe('number')
  })

  it('sets created_at', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    expect(user!.created_at.toSeconds()).toBeWithin(1, DateTime.now().toUTC().toSeconds())
    const reloadedUser = await User.find(user.id)
    expect(reloadedUser!.created_at.toSeconds()).toBeWithin(1, DateTime.now().toUTC().toSeconds())
  })

  it('sets updated_at', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const now = DateTime.now().toUTC()
    expect(user!.updated_at.toSeconds()).toBeWithin(1, now.toSeconds())
    const reloadedUser = await User.find(user.id)
    expect(reloadedUser!.updated_at.toSeconds()).toBeWithin(1, DateTime.now().toUTC().toSeconds())
  })

  it('allows saving of valid blank objects', async () => {
    const pet = await Pet.create()
    expect(typeof pet!.id).toBe('number')
    const reloadedPet = await Pet.find(pet.id)
    expect(typeof reloadedPet!.id).toBe('number')
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

    context('the associated model is unsaved', () => {
      it('saves the associated record, then captures the primary key and stores it as the foreign key against the saving model', async () => {
        const user = User.new({ email: 'fred@fred', password: 'howyadoin' })
        const composition = await Composition.create({ content: 'howyadoin', user })

        expect(typeof composition.user_id).toBe('number')
        expect(composition.user.isPersisted).toBe(true)
        expect(composition.user.email).toEqual('fred@fred')
      })

      context('the associated model is polymorphic', () => {
        it('stores the foreign key type as well as the foreign key id', async () => {
          const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
          const post = Post.new({ user_id: user.id })
          const rating = await Rating.create({ user, rateable: post })

          expect(rating.rateable_id).toEqual(post.id)
          expect(rating.rateable_type).toEqual('Post')
          const reloadedRating = await Rating.find(rating.id)
          expect(reloadedRating!.rateable_id).toEqual(post.id)
          expect(reloadedRating!.rateable_type).toEqual('Post')
        })
      })
    })
  })

  context('passed a model to a HasOne association', () => {
    it('raises an exception', async () => {
      const userSettings = UserSettings.new({ likes_chalupas: true })
      await expect(
        // @ts-ignore
        User.create({ email: 'fred@fishman', password: 'howyadoin', userSettings })
      ).rejects.toThrowError(CanOnlyPassBelongsToModelParam)
    })
  })
})
