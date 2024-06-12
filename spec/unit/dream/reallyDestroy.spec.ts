import { Query } from '../../../src'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import Post from '../../../test-app/app/models/Post'
import Rating from '../../../test-app/app/models/Rating'
import User from '../../../test-app/app/models/User'

describe('Dream#reallyDestroy', () => {
  it('destroys the record', async () => {
    await User.create({ email: 'how@yadoin', password: 'howyadoin' })
    expect(await User.count()).toEqual(1)

    await User.query().reallyDestroy()
    expect(await User.count()).toEqual(0)
  })

  it('calls Query#destroy', async () => {
    const spy = jest.spyOn(Query.prototype, 'reallyDestroy')
    await User.query().reallyDestroy()
    expect(spy).toHaveBeenCalled()
  })

  context('skipHooks=true', () => {
    it('passes along skipHooks to underlying destroy call', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const spy = jest.spyOn(Query.prototype, 'reallyDestroy')
      await user.reallyDestroy({ skipHooks: true })
      expect(spy).toHaveBeenCalledWith({ skipHooks: true })
    })
  })

  context('for a SoftDelete model', () => {
    it('bypasses soft delete pattern to really destroy the model', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const post = await Post.create({ user })

      expect(await Post.count()).toEqual(1)
      await post.reallyDestroy()

      expect(await Post.count()).toEqual(0)
      expect(await Post.unscoped().count()).toEqual(0)
    })

    context('within a transaction', () => {
      it('applies transaction to query', async () => {
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
        const post = await Post.create({ user })
        await Rating.create({ rateable: post, user })

        expect(await Rating.count()).toEqual(1)

        try {
          await ApplicationModel.transaction(async txn => {
            await Post.query().txn(txn).reallyDestroy()
            throw new Error('testing transaction rollback')
          })
        } catch {
          // noop
        }

        expect(await Rating.count()).toEqual(1)
        expect(await Rating.unscoped().count()).toEqual(1)

        await ApplicationModel.transaction(async txn => {
          await post.txn(txn).reallyDestroy()
        })

        expect(await Rating.count()).toEqual(0)
        expect(await Rating.unscoped().count()).toEqual(0)
      })

      context('skipHooks=true', () => {
        it('passes skipHooks to underlying call', async () => {
          const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          const post = await Post.create({ user })

          const spy = jest.spyOn(Query.prototype, 'destroy')

          await ApplicationModel.transaction(async txn => {
            await post.txn(txn).reallyDestroy({ skipHooks: true })
          })

          expect(spy).toHaveBeenCalledWith({ skipHooks: true })
        })
      })
    })
  })
})
