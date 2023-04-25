import Composition from '../../../test-app/app/models/composition'
import Post from '../../../test-app/app/models/post'
import Rating from '../../../test-app/app/models/rating'
import User from '../../../test-app/app/models/user'
import UserSettings from '../../../test-app/app/models/user-settings'
import CanOnlyPassBelongsToModelParam from '../../../src/exceptions/can-only-pass-belongs-to-model-param'
import { DateTime } from 'luxon'
import Pet from '../../../test-app/app/models/pet'

describe('Dream#update', () => {
  it('updates the underlying model in the db', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'Charlie Brown' })
    expect(user.name).toEqual('Charlie Brown')
    await user.update({ name: 'Snoopy' })

    expect(user.name).toEqual('Snoopy')
    const reloadedUser = await User.find(user.id)
    expect(reloadedUser!.name).toEqual('Snoopy')
  })

  it('updates the updated_at field', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'Charlie Brown' })
    expect(user.created_at).toEqual(user.updated_at)

    await user.update({ email: 'how@yadoin' })
    expect(user.updated_at).not.toEqual(user.created_at)
    expect(user.updated_at).toBeInstanceOf(DateTime)
  })

  context('the model does not have an updated_at field', () => {
    it('does not raise an exception', async () => {
      const user = await User.create({ email: 'fred@dred', password: 'howyadoin' })
      const pet = await Pet.create({ user, name: 'pal', species: 'cat' })

      // this is really checking that updating a stray attribute does not
      // raise an exception, since the Pet model was configured intentionally
      // to be missing an updated_at field.
      await pet.update({ name: 'pal mcjones' })
      expect(pet.name).toEqual('pal mcjones')
    })
  })

  context('passed a model to a BelongsTo association', () => {
    it('sets the foreign key on this object', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const otherUser = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      await composition.update({ user: otherUser })

      expect(composition.user_id).toEqual(otherUser.id)
      const reloadedComposition = await Composition.find(composition.id)
      expect(reloadedComposition!.user_id).toEqual(otherUser.id)
    })

    it('sets the reference to that model', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const otherUser = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      await composition.update({ user: otherUser })

      expect(composition.user).toEqual(otherUser)
    })

    context('when the model is polymorphic', () => {
      it('sets the foreign key and foreign key type on this object', async () => {
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const post = await Post.create({ user })
        const composition = await Composition.create({ user })
        const rating = await Rating.create({ user, rateable: post })
        await rating.update({ rateable: composition })

        expect(rating.rateable_id).toEqual(composition.id)
        expect(rating.rateable_type).toEqual('Composition')
        const reloadedRating = await Rating.find(rating.id)
        expect(reloadedRating!.rateable_id).toEqual(composition.id)
        expect(reloadedRating!.rateable_type).toEqual('Composition')
      })

      it('sets the reference to that model', async () => {
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const post = await Post.create({ user })
        const composition = await Composition.create({ user })
        const rating = await Rating.create({ user, rateable: post })
        await rating.update({ rateable: composition })

        expect(rating.rateable).toEqual(composition)
      })
    })
  })

  context('when passed an unsaved association', () => {
    it('saves the associated record, then captures the primary key and stores it as the foreign key against the saving model', async () => {
      const user = new User({ email: 'fred@fred', password: 'howyadoin' })
      const user2 = new User({ email: 'fred2@fred', password: 'howyadoin' })
      const composition = await Composition.create({ content: 'howyadoin', user })

      await composition.update({ user: user2 })
      expect(user2.isPersisted).toEqual(true)
      expect(composition.user_id).toEqual(user2.id)
    })

    context('the associated model is polymorphic', () => {
      it('stores the foreign key type as well as the foreign key id', async () => {
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const post = new Post({ user_id: user.id })
        const post2 = new Post({ user_id: user.id })
        const rating = await Rating.create({ user, rateable: post })

        await rating.update({ rateable: post2 })
        expect(rating.rateable_id).toEqual(post2.id)
        expect(rating.rateable_type).toEqual('Post')

        const reloadedRating = await Rating.find(rating.id)
        expect(reloadedRating!.rateable_id).toEqual(post2.id)
        expect(reloadedRating!.rateable_type).toEqual('Post')
      })
    })
  })

  context('passed a model to a HasOne association', () => {
    it('raises an exception', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const userSettings = new UserSettings({ likes_chalupas: true })

      await expect(
        // @ts-ignore
        async () => await user.update({ userSettings })
      ).rejects.toThrowError(CanOnlyPassBelongsToModelParam)
    })
  })

  // context('passed a model to a HasOne through association', () => {
  // })
})
