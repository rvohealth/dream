import { DateTime } from 'luxon'
import User from '../../../test-app/app/models/User'
import { Dream } from '../../../src'
import Post from '../../../test-app/app/models/Post'
import Rating from '../../../test-app/app/models/Rating'

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
        await Dream.transaction(async txn => {
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
          await rating.load('rateable', 'user')

          rating.rateable.user.email = 'calvin@coolidge'
          await rating.save()

          const reloadedUser = await User.find(user.id)
          expect(reloadedUser!.email).toEqual('calvin@coolidge')
        })
      })
    })

    it('sets created_at', async () => {
      await user.save()
      expect(user!.created_at.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
      const reloadedUser = await User.find(user.id)
      expect(reloadedUser!.created_at.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
    })

    context('when created_at is passed', () => {
      it('doesn’t override created_at', async () => {
        const createdAt = DateTime.now().minus({ day: 1 })
        user.created_at = createdAt
        await user.save()
        expect(user!.created_at.toSeconds()).toBeWithin(1, createdAt.toSeconds())
        const reloadedUser = await User.find(user.id)
        expect(reloadedUser!.created_at.toSeconds()).toBeWithin(1, createdAt.toSeconds())
      })
    })

    it('sets updated_at', async () => {
      await user.save()
      expect(user!.updated_at.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
      const reloadedUser = await User.find(user.id)
      expect(reloadedUser!.updated_at.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
    })

    context('when updated_at is passed', () => {
      it('doesn’t override updated_at', async () => {
        const updatedAt = DateTime.now().minus({ day: 1 })
        user.updated_at = updatedAt
        await user.save()
        expect(user!.updated_at.toSeconds()).toBeWithin(1, updatedAt.toSeconds())
        const reloadedUser = await User.find(user.id)
        expect(reloadedUser!.updated_at.toSeconds()).toBeWithin(1, updatedAt.toSeconds())
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

    it('sets created_at', async () => {
      expect(user!.created_at.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
      const reloadedUser = await User.find(user.id)
      expect(reloadedUser!.created_at.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
    })

    it('sets updated_at', async () => {
      expect(user!.updated_at.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
      const reloadedUser = await User.find(user.id)
      expect(reloadedUser!.updated_at.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
    })
  })
})
