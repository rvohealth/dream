import { Query } from '../../../src'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import Post from '../../../test-app/app/models/Post'
import Rating from '../../../test-app/app/models/Rating'
import User from '../../../test-app/app/models/User'

describe('Query#reallyDestroy', () => {
  it('destroys the record', async () => {
    await User.create({ email: 'how@yadoin', password: 'howyadoin' })
    expect(await User.count()).toEqual(1)

    await User.query().reallyDestroy()
    expect(await User.count()).toEqual(0)
  })

  // by testing that we are just calling
  // down to Query#destroy, we can avoid
  // duplicating specs for all the unique
  // cases that Query#destroy handles
  it('calls Query#destroy', async () => {
    const spy = jest.spyOn(Query.prototype, 'destroy')
    await User.query().reallyDestroy()
    expect(spy).toHaveBeenCalled()
  })

  context('for a SoftDelete model', () => {
    it('bypasses soft delete pattern to really destroy the model', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      await Post.create({ user })

      expect(await Post.count()).toEqual(1)
      await Post.query().reallyDestroy()

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
          await Post.query().txn(txn).reallyDestroy()
        })

        expect(await Rating.count()).toEqual(0)
        expect(await Rating.unscoped().count()).toEqual(0)
      })
    })

    context('the SoftDelete model has associations that are also SoftDelete', () => {
      it('bypasses soft delete pattern for nested associations', async () => {
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
        const post = await Post.create({ user })
        await Rating.create({ rateable: post, user })

        expect(await Rating.count()).toEqual(1)
        await Post.query().reallyDestroy()

        expect(await Rating.count()).toEqual(0)
        expect(await Rating.unscoped().count()).toEqual(0)
      })
    })
  })

  context('skipHooks is passed', () => {
    it('passes along skipHooks to underlying destroy call', async () => {
      const spy = jest.spyOn(Query.prototype, 'destroy')
      await User.query().reallyDestroy({ skipHooks: true })
      expect(spy).toHaveBeenCalledWith({ skipHooks: true })
    })
  })

  context('cascade is passed', () => {
    it('passes along cascade to underlying destroy call', async () => {
      const spy = jest.spyOn(Query.prototype, 'destroy')
      await User.query().reallyDestroy({ cascade: false })
      expect(spy).toHaveBeenCalledWith({ cascade: false })
    })
  })
})
