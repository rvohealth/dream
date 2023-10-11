import { DateTime } from 'luxon'
import User from '../../../test-app/app/models/User'
import Post from '../../../test-app/app/models/Post'
import Rating from '../../../test-app/app/models/Rating'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'

describe('Dream#save', () => {
  context('a new record', () => {
    let user: User

    beforeEach(async () => {
      user = await User.new({ email: 'fred@frewd', password: 'howyadoin' })
    })

    it('saves', async () => {
      await user.save()
      const reloadedUser = await User.find(user.id)
      expect(reloadedUser).toMatchDreamModel(user)
    })

    context('when encased in a transaction', () => {
      it('updates the underlying model in the db', async () => {
        await ApplicationModel.transaction(async txn => {
          await user.txn(txn).save()
        })

        const reloadedUser = await User.find(user.id)
        expect(reloadedUser).toMatchDreamModel(user)
      })
    })

    context('saving associations', () => {
      context('with an unsaved association', () => {
        it('saves the unsaved association', async () => {
          const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          const post = await Post.create({ user })
          user.email = 'calvin@coolidge'
          await post.save()

          const reloadedUser = await User.find(user.id)
          expect(reloadedUser!.email).toEqual('calvin@coolidge')
        })
      })

      context('with an unsaved nested association', () => {
        it('saves the unsaved nested association', async () => {
          const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          const post = await Post.create({ user })
          const rating = await Rating.create({ rateable: post, rating: 10, user })
          const reloaded = await rating.load('rateable', 'user').execute()

          reloaded.rateable.user.email = 'calvin@coolidge'
          await reloaded.save()

          const reloadedUser = await User.find(user.id)
          expect(reloadedUser!.email).toEqual('calvin@coolidge')
        })
      })
    })

    it('sets createdAt', async () => {
      await user.save()
      expect(user!.createdAt.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
      const reloadedUser = await User.find(user.id)
      expect(reloadedUser!.createdAt.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
    })

    context('when createdAt is passed', () => {
      it('doesn’t override createdAt', async () => {
        const createdAt = DateTime.now().minus({ day: 1 })
        user.createdAt = createdAt
        await user.save()
        expect(user!.createdAt.toSeconds()).toBeWithin(1, createdAt.toSeconds())
        const reloadedUser = await User.find(user.id)
        expect(reloadedUser!.createdAt.toSeconds()).toBeWithin(1, createdAt.toSeconds())
      })
    })

    it('sets updatedAt', async () => {
      await user.save()
      expect(user!.updatedAt.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
      const reloadedUser = await User.find(user.id)
      expect(reloadedUser!.updatedAt.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
    })

    context('when updatedAt is passed', () => {
      it('doesn’t override updatedAt', async () => {
        const updatedAt = DateTime.now().minus({ day: 1 })
        user.updatedAt = updatedAt
        await user.save()
        expect(user!.updatedAt.toSeconds()).toBeWithin(1, updatedAt.toSeconds())
        const reloadedUser = await User.find(user.id)
        expect(reloadedUser!.updatedAt.toSeconds()).toBeWithin(1, updatedAt.toSeconds())
      })
    })
  })

  context('a persisted record', () => {
    let user: User

    beforeEach(async () => {
      user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      user.name = 'cheese'
      await user.save()
    })

    it('saves', async () => {
      const reloadedUser = await User.find(user.id)
      expect(reloadedUser!.name).toEqual('cheese')
    })

    it('sets createdAt', async () => {
      expect(user!.createdAt.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
      const reloadedUser = await User.find(user.id)
      expect(reloadedUser!.createdAt.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
    })

    it('sets updatedAt', async () => {
      expect(user!.updatedAt.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
      const reloadedUser = await User.find(user.id)
      expect(reloadedUser!.updatedAt.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
    })
  })
})
