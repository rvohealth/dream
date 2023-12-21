import Composition from '../../../test-app/app/models/Composition'
import Post from '../../../test-app/app/models/Post'
import Rating from '../../../test-app/app/models/Rating'
import User from '../../../test-app/app/models/User'
import UserSettings from '../../../test-app/app/models/UserSettings'
import CanOnlyPassBelongsToModelParam from '../../../src/exceptions/associations/can-only-pass-belongs-to-model-param'
import { DateTime } from 'luxon'
import Pet from '../../../test-app/app/models/Pet'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'

describe('Dream#update', () => {
  it('updates the underlying model in the db', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'Charlie Brown' })
    expect(user.name).toEqual('Charlie Brown')
    await user.update({ name: 'Snoopy' })

    expect(user.name).toEqual('Snoopy')
    const reloadedUser = await User.find(user.id)
    expect(reloadedUser!.name).toEqual('Snoopy')
  })

  it('does not update neighboring records', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'Charlie Brown' })
    const user2 = await User.create({ email: 'fred@fred', password: 'howyadoin', name: 'Blues jr' })

    await user.update({ email: 'how@yadoin' })
    await user2.reload()
    expect(user2.email).toEqual('fred@fred')
  })

  context('when encased in a transaction', () => {
    it('updates the underlying model in the db', async () => {
      let user: User | null = null
      await ApplicationModel.transaction(async txn => {
        user = await User.txn(txn).create({
          email: 'fred@frewd',
          password: 'howyadoin',
          name: 'Charlie Brown',
        })

        expect(user.name).toEqual('Charlie Brown')
        await user.txn(txn).update({ name: 'Snoopy' })
      })

      expect(user!.name).toEqual('Snoopy')
      const reloadedUser = await User.find(user!.id)
      expect(reloadedUser!.name).toEqual('Snoopy')
    })
  })

  it('updates the updatedAt field', async () => {
    const updatedAt = DateTime.now().minus({ day: 1 })
    const user = await User.create({
      email: 'fred@frewd',
      password: 'howyadoin',
      name: 'Charlie Brown',
      updatedAt: updatedAt,
    })
    expect(user!.updatedAt.toSeconds()).toBeWithin(1, updatedAt.toSeconds())

    await user.update({ email: 'how@yadoin' })
    expect(user!.updatedAt.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
    const reloadedUser = await User.find(user.id)
    expect(reloadedUser!.updatedAt.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
  })

  context('the model does not have an updatedAt field', () => {
    it('does not raise an exception', async () => {
      const user = await User.create({ email: 'fred@dred', password: 'howyadoin' })
      const pet = await Pet.create({ user, name: 'pal', species: 'cat' })

      // this is really checking that updating a stray attribute does not
      // raise an exception, since the Pet model was configured intentionally
      // to be missing an updatedAt field.
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

      expect(composition.userId).toEqual(otherUser.id)
      const reloadedComposition = await Composition.find(composition.id)
      expect(reloadedComposition!.userId).toEqual(otherUser.id)
    })

    it('sets the reference to that model', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const otherUser = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      await composition.update({ user: otherUser })

      expect(composition.user).toEqual(otherUser)
    })

    context('when the association being set has been loaded with a different model', () => {
      it('sets the reference to that model', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const otherUser = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ user })
        const reloaded = await Composition.preload('user').find(composition.id)
        await reloaded!.update({ user: otherUser })

        expect(reloaded!.user).toEqual(otherUser)
      })
    })

    context('when the model is polymorphic', () => {
      it('sets the foreign key and foreign key type on this object', async () => {
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const post = await Post.create({ user })
        const composition = await Composition.create({ user })
        const rating = await Rating.create({ user, rateable: post })
        await rating.update({ rateable: composition })

        expect(rating.rateableId).toEqual(composition.id)
        expect(rating.rateableType).toEqual('Composition')
        const reloadedRating = await Rating.find(rating.id)
        expect(reloadedRating!.rateableId).toEqual(composition.id)
        expect(reloadedRating!.rateableType).toEqual('Composition')
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
      const user = User.new({ email: 'fred@fred', password: 'howyadoin' })
      const user2 = User.new({ email: 'fred2@fred', password: 'howyadoin' })
      const composition = await Composition.create({ content: 'howyadoin', user })

      await composition.update({ user: user2 })
      expect(user2.isPersisted).toEqual(true)
      expect(typeof composition.userId).toEqual('string')
      expect(composition.userId).toEqual(user2.id)

      const reloadedComposition = await Composition.find(composition.id)
      expect(reloadedComposition!.userId).toEqual(user2.id)
    })

    context('the associated model is polymorphic', () => {
      it('stores the foreign key type as well as the foreign key id', async () => {
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const post = Post.new({ userId: user.id })
        const post2 = Post.new({ userId: user.id })
        const rating = await Rating.create({ user, rateable: post })

        await rating.update({ rateable: post2 })
        expect(rating.rateableId).toEqual(post2.id)
        expect(rating.rateableType).toEqual('Post')

        const reloadedRating = await Rating.find(rating.id)
        expect(reloadedRating!.rateableId).toEqual(post2.id)
        expect(reloadedRating!.rateableType).toEqual('Post')
      })
    })
  })

  context('passed a model to a HasOne association', () => {
    it('raises an exception', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const userSettings = UserSettings.new({ likesChalupas: true })

      await expect(
        // @ts-ignore
        user.update({ userSettings })
      ).rejects.toThrowError(CanOnlyPassBelongsToModelParam)
    })
  })

  context('given a postgres array field', () => {
    it('correctly inserts the array values into the field', async () => {
      const pet = await Pet.create({
        favoriteTreats: ['chicken', 'tuna', 'cat-safe chalupas (catlupas,supaloopas)'],
      })
      await pet.update({ favoriteTreats: ['chicken'] })

      expect(pet.favoriteTreats).toEqual(['chicken'])

      await pet.reload()
      expect(pet.favoriteTreats).toEqual(['chicken'])
    })
  })

  context('datetime field', () => {
    let user: User

    beforeEach(async () => {
      user = await User.create({
        email: 'ham@',
        password: 'chalupas',
      })
    })

    it('updates to the date', async () => {
      const newTime = DateTime.now().minus({ days: 7 })
      await user.update({ deletedAt: newTime })
      const reloaded = await User.unscoped().find(user.id)
      expect(reloaded!.deletedAt).toEqualDateTime(newTime)
    })

    context('with a string representation of a datetime', () => {
      it('updates to the datetime', async () => {
        const newTime = DateTime.now().minus({ days: 7 })
        await user.update({ deletedAt: newTime.toISO() as any })
        const reloaded = await User.unscoped().find(user.id)
        expect(reloaded!.deletedAt).toEqualDateTime(newTime)
      })
    })
  })

  context('date field', () => {
    let user: User
    const dateString = '1980-10-13'

    beforeEach(async () => {
      user = await User.create({
        email: 'ham@',
        password: 'chalupas',
      })
    })

    it('updates to the date', async () => {
      const newDate = DateTime.fromISO(dateString)
      await user.update({ birthdate: newDate })
      const reloaded = await User.unscoped().find(user.id)
      expect(reloaded!.birthdate.toISODate()).toEqual(dateString)
    })

    context('with a string representation of a date', () => {
      it('updates to the date', async () => {
        await user.update({ birthdate: dateString as any })
        const reloaded = await User.unscoped().find(user.id)
        expect(reloaded!.birthdate.toISODate()).toEqual(dateString)
      })
    })
  })
})
