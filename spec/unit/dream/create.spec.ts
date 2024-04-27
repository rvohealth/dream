import Composition from '../../../test-app/app/models/Composition'
import Post from '../../../test-app/app/models/Post'
import Rating from '../../../test-app/app/models/Rating'
import User from '../../../test-app/app/models/User'
import UserSettings from '../../../test-app/app/models/UserSettings'
import CanOnlyPassBelongsToModelParam from '../../../src/exceptions/associations/can-only-pass-belongs-to-model-param'
import Pet from '../../../test-app/app/models/Pet'
import { DateTime } from 'luxon'
import PostVisibility from '../../../test-app/app/models/PostVisibility'
import ReplicaSafe from '../../../src/decorators/replica-safe'
import DreamDbConnection from '../../../src/db/dream-db-connection'
import EdgeCaseAttribute from '../../../test-app/app/models/EdgeCaseAttribute'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'

describe('Dream.create', () => {
  it('creates the underlying model in the db', async () => {
    const u = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.find(u.id)
    expect(user!.email).toEqual('fred@frewd')
    expect(typeof user!.id).toBe('string')
  })

  it('sets createdAt', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    expect(user.createdAt.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
    const reloadedUser = await User.find(user.id)
    expect(reloadedUser!.createdAt.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
  })

  it('sets updatedAt', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const now = DateTime.now()
    expect(user.updatedAt.toSeconds()).toBeWithin(1, now.toSeconds())
    const reloadedUser = await User.find(user.id)
    expect(reloadedUser!.updatedAt.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
  })

  context('given a transaction', () => {
    it('saves the record', async () => {
      let user: User | null = null

      await ApplicationModel.transaction(async txn => {
        user = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
      })

      const reloadedUser = await User.find(user!.id)
      expect(reloadedUser).toMatchDreamModel(user)
    })
  })

  it('allows saving of valid blank objects', async () => {
    const pet = await Pet.create()
    expect(typeof pet.id).toBe('string')
    const reloadedPet = await Pet.find(pet.id)
    expect(typeof reloadedPet!.id).toBe('string')
  })

  context('passed a model to a BelongsTo association', () => {
    it('sets the foreign key on this object', async () => {
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      expect(composition.userId).toEqual(user.id)

      const reloadedComposition = await Composition.find(composition.id)
      expect(reloadedComposition!.userId).toEqual(user.id)
    })

    context('when the association being set has an overridden primary key', () => {
      it('sets the foreign key to the overriden primary key value', async () => {
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const pet = await Pet.create({ userThroughUuid: user })
        expect(pet.userUuid).toEqual(user.uuid)

        const reloaded = await Pet.find(pet.id)
        expect(reloaded!.userUuid).toEqual(user.uuid)
      })
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

        expect(rating.rateableId).toEqual(post.id)
        expect(rating.rateableType).toEqual('Post')
        const reloadedRating = await Rating.find(rating.id)
        expect(reloadedRating!.rateableId).toEqual(post.id)
        expect(reloadedRating!.rateableType).toEqual('Post')
      })

      it('sets the reference to that model', async () => {
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const post = await Post.create({ user })
        const rating = await Rating.create({ user, rateable: post })

        expect(rating.rateable).toEqual(post)
      })

      context('saving the associated model fails', () => {
        it('does not persist the original record, nor any other associated models', async () => {
          // the PostVisibility model is set up to raise an exception whenever
          // its "notes" field is set to "raise exception if notes set to this"
          const postVisibility = PostVisibility.new({ notes: 'raise exception if notes set to this' })

          const user = User.new({ email: 'fred@fishman', password: 'howyadoin' })
          const post = Post.new({ user, postVisibility })

          // TODO: make this work with expect(...).rejects.toThrow
          // eg:
          //    await expect(post.save()).rejects.toThrow()
          let hasError = false
          try {
            await post.save()
          } catch (err) {
            hasError = true
          }
          expect(hasError).toEqual(true)

          expect(await PostVisibility.count()).toEqual(0)
          expect(await User.count()).toEqual(0)
          expect(await Post.count()).toEqual(0)
        })
      })
    })

    context('the associated model is unsaved', () => {
      it('saves the associated record, then captures the primary key and stores it as the foreign key against the saving model', async () => {
        const user = User.new({ email: 'fred@fred', password: 'howyadoin' })
        const composition = await Composition.create({ content: 'howyadoin', user })

        expect(typeof composition.userId).toBe('string')
        expect(composition.user.isPersisted).toBe(true)
        expect(composition.user).toMatchDreamModel(user)
      })

      context('the associated model is polymorphic', () => {
        it('stores the foreign key type as well as the foreign key id', async () => {
          const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
          const post = Post.new({ userId: user.id })
          const rating = await Rating.create({ user, rateable: post })

          expect(rating.rateableId).toEqual(post.id)
          expect(rating.rateableType).toEqual('Post')
          const reloadedRating = await Rating.find(rating.id)
          expect(reloadedRating!.rateableId).toEqual(post.id)
          expect(reloadedRating!.rateableType).toEqual('Post')
        })
      })
    })
  })

  context('passed a model to a HasOne association', () => {
    it('raises an exception', async () => {
      const userSettings = UserSettings.new({ likesChalupas: true })
      await expect(
        User.create({ email: 'fred@fishman', password: 'howyadoin', userSettings } as any)
      ).rejects.toThrowError(CanOnlyPassBelongsToModelParam)
    })
  })

  context('regarding connections', () => {
    beforeEach(() => {
      jest.spyOn(DreamDbConnection, 'getConnection')
    })

    it('uses primary connection', async () => {
      await User.create({ email: 'how@yadoin', password: 'howyadoin' })

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(DreamDbConnection.getConnection).toHaveBeenCalledWith('primary', expect.objectContaining({}))
    })

    context('with replica connection specified', () => {
      @ReplicaSafe()
      class CustomUser extends User {}

      it('uses the primary connection', async () => {
        await CustomUser.create({ email: 'how@yadoin', password: 'howyadoin' })

        // should always call to primary for update, regardless of replica-safe status
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(DreamDbConnection.getConnection).toHaveBeenCalledWith('primary', expect.objectContaining({}))
      })
    })
  })

  context('camel-case edge cases', () => {
    it('translates properly to the database layer', async () => {
      await EdgeCaseAttribute.create({ kPop: true, popK: 'a', popKPop: 7 })
      const edgeCase = await EdgeCaseAttribute.first()
      expect(edgeCase!.kPop).toBe(true)
      expect(edgeCase!.popK).toEqual('a')
      expect(edgeCase!.popKPop).toEqual(7)
    })
  })

  context('datetime field', () => {
    it('creates the model with the specified date', async () => {
      const aTime = DateTime.now().minus({ days: 7 })

      const user = await User.create({
        email: 'ham@',
        password: 'chalupas',
        deletedAt: aTime,
      })

      const reloaded = await User.unscoped().find(user.id)
      expect(reloaded!.deletedAt).toEqualDateTime(aTime)
    })

    context('with a string representation of a datetime', () => {
      it('creates the model with the specified datetime', async () => {
        const aTime = DateTime.now().minus({ days: 7 })

        const user = await User.create({
          email: 'ham@',
          password: 'chalupas',
          deletedAt: aTime.toISO() as any,
        })

        const reloaded = await User.unscoped().find(user.id)
        expect(reloaded!.deletedAt).toEqualDateTime(aTime)
      })
    })
  })

  context('date field', () => {
    const dateString = '1980-10-13'

    it('creates the model with the specified date', async () => {
      const aDate = DateTime.fromISO(dateString)

      const user = await User.create({
        email: 'ham@',
        password: 'chalupas',
        birthdate: aDate,
      })

      const reloaded = await User.unscoped().find(user.id)
      expect(reloaded!.birthdate!.toISODate()).toEqual(dateString)
    })

    context('with a string representation of a date', () => {
      it('creates the model with the specified date', async () => {
        const user = await User.create({
          email: 'ham@',
          password: 'chalupas',
          birthdate: dateString as any,
        })

        const reloaded = await User.unscoped().find(user.id)
        expect(reloaded!.birthdate!.toISODate()).toEqual(dateString)
      })
    })
  })
})
