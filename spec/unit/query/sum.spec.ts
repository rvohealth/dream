import ops from '../../../src/ops/index.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset.js'
import Post from '../../../test-app/app/models/Post.js'
import Rating from '../../../test-app/app/models/Rating.js'
import User from '../../../test-app/app/models/User.js'

describe('Query#sum', () => {
  it('sums all values for the specified column', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
    await Post.create({ user, position: 1 })
    await Post.create({ user, position: 2 })
    await Post.create({ user, position: 3 })
    expect(await Post.sum('position')).toEqual(6)
  })

  context('with a non-numeric field being summed', () => {
    it('raises an exception', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      await Post.create({ user })
      await Post.create({ user })
      await Post.create({ user })

      // we allow the kysely exception to bubble through in this case
      await expect(async () => await Post.sum('createdAt')).rejects.toThrow()
    })
  })

  context('with some fields set to null', () => {
    it('treats null as 0', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      await Post.create({ user })
      await Post.create({ user, position: null }, { skipHooks: true })

      expect(await Post.sum('position')).toEqual(1)
    })
  })

  context('with all fields set to null', () => {
    it('returns null', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      await Post.create({ user, position: null }, { skipHooks: true })
      await Post.create({ user, position: null }, { skipHooks: true })

      expect(await Post.sum('position')).toBeNull()
    })
  })

  context('with a where statement passed', () => {
    context('with a similarity operator passed', () => {
      it('respects the similarity operator', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        await Post.create({ user, body: 'universe', position: 1 })
        await Post.create({ user, body: 'world', position: 2 })
        await Post.create({ user, body: 'world', position: 3 })

        const sum = await Post.where({ body: ops.similarity('world') }).sum('position')

        expect(sum).toEqual(5)
      })
    })
  })

  context('hasMany', () => {
    it('returns the sum', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      await CompositionAsset.create({ composition, score: 7 })
      await CompositionAsset.create({ composition, score: 3 })

      const composition2 = await Composition.create({ user })
      await CompositionAsset.create({ composition: composition2, score: 100 })

      const sum = await composition.associationQuery('compositionAssets').sum('score')

      expect(sum).toEqual(10)
    })

    context('polymorphic hasMany', () => {
      it('returns the sum', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })

        const post1 = await Post.create({ user })
        const post2 = await Post.create({ user })

        await Rating.create({ user, rateable: post1, rating: 3 })
        await Rating.create({ user, rateable: post1, rating: 4 })
        await Rating.create({ user, rateable: post2, rating: 1 })
        await Rating.create({ user, rateable: post1, rating: 2 })

        const sum = await post1.associationQuery('ratings').sum('rating')

        expect(sum).toEqual(9)
      })
    })
  })

  context('hasMany through', () => {
    it('returns the sum', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition1 = await Composition.create({ user })
      const composition2 = await Composition.create({ user })

      await CompositionAsset.create({ composition: composition1, score: 7 })
      await CompositionAsset.create({ composition: composition2, score: 3 })

      const sum = await user.associationQuery('compositionAssets').sum('score')

      expect(sum).toEqual(10)
    })
  })

  context('on a join', () => {
    it('returns the sum field, first traveling through nested associations', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      await CompositionAsset.create({ composition, score: 7 })
      await CompositionAsset.create({ composition, score: 3 })

      const sum = await Composition.query().innerJoin('compositionAssets').sum('compositionAssets.score')

      expect(sum).toEqual(10)
    })

    context('when passed a where clause', () => {
      it('respects the where clause', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        const composition = await Composition.create({ user })

        await CompositionAsset.create({ composition, name: 'howyadoin', score: 7 })
        await CompositionAsset.create({ composition, score: 3 })

        const sum = await Composition.query()
          .innerJoin('compositionAssets', { and: { name: 'howyadoin' } })
          .sum('compositionAssets.score')

        expect(sum).toEqual(7)
      })
    })

    context('when passed a transaction', () => {
      it('returns the sum, traveling through nested associations', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        const composition = await Composition.create({ user })

        await CompositionAsset.create({ composition, score: 7 })
        let sum = await CompositionAsset.sum('score')
        expect(sum).toEqual(7)

        await ApplicationModel.transaction(async txn => {
          await CompositionAsset.txn(txn).create({ composition, score: 3 })

          sum = await Composition.query()
            .txn(txn)
            .innerJoin('compositionAssets')
            .sum('compositionAssets.score')
        })

        expect(sum).toEqual(10)
      })
    })
  })
})
