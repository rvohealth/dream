import Composition from '../../../test-app/app/models/Composition'
import Post from '../../../test-app/app/models/Post'
import Rating from '../../../test-app/app/models/Rating'
import User from '../../../test-app/app/models/User'
import UserSettings from '../../../test-app/app/models/UserSettings'
import CanOnlyPassBelongsToModelParam from '../../../src/exceptions/associations/can-only-pass-belongs-to-model-param'
import Pet from '../../../test-app/app/models/Pet'
import { DateTime } from 'luxon'
import PostVisibility from '../../../test-app/app/models/PostVisibility'
import { Dream } from '../../../src'
import ConnectionConfRetriever from '../../../src/db/connection-conf-retriever'
import ReplicaSafe from '../../../src/decorators/replica-safe'
import DreamDbConnection from '../../../src/db/dream-db-connection'

describe('Dream.create', () => {
  it('creates the underlying model in the db', async () => {
    const u = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.find(u.id)
    expect(user!.email).toEqual('fred@frewd')
    expect(typeof user!.id).toBe('string')
  })

  it('sets created_at', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    expect(user!.created_at.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
    const reloadedUser = await User.find(user.id)
    expect(reloadedUser!.created_at.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
  })

  it('sets updated_at', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const now = DateTime.now()
    expect(user!.updated_at.toSeconds()).toBeWithin(1, now.toSeconds())
    const reloadedUser = await User.find(user.id)
    expect(reloadedUser!.updated_at.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
  })

  context('given a transaction', () => {
    it('saves the record', async () => {
      let user: User | null = null

      await Dream.transaction(async txn => {
        user = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
      })

      const reloadedUser = await User.find(user!.id)
      expect(reloadedUser).toMatchDreamModel(user)
    })
  })

  it('allows saving of valid blank objects', async () => {
    const pet = await Pet.create()
    expect(typeof pet!.id).toBe('string')
    const reloadedPet = await Pet.find(pet.id)
    expect(typeof reloadedPet!.id).toBe('string')
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

        expect(typeof composition.user_id).toBe('string')
        expect(composition.user.isPersisted).toBe(true)
        expect(composition.user).toMatchDreamModel(user)
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

  context('regarding connections', () => {
    beforeEach(async () => {
      jest.spyOn(DreamDbConnection, 'getConnection')
    })

    it('uses primary connection', async () => {
      await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      expect(DreamDbConnection.getConnection).toHaveBeenCalledWith('primary')
    })

    context('with replica connection specified', () => {
      @ReplicaSafe()
      class CustomUser extends User {}

      it('uses the primary connection', async () => {
        await CustomUser.create({ email: 'how@yadoin', password: 'howyadoin' })
        // should always call to primary for update, regardless of replica-safe status
        expect(DreamDbConnection.getConnection).toHaveBeenCalledWith('primary')
      })
    })
  })
})
