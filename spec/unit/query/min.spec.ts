import ops from '../../../src/ops.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset.js'
import Post from '../../../test-app/app/models/Post.js'
import Rating from '../../../test-app/app/models/Rating.js'
import User from '../../../test-app/app/models/User.js'

describe('Query#min', () => {
  it('returns the record with the lowest value', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
    const post1 = await Post.create({ user, body: 'universe' })
    await Post.create({ user, body: 'world' })
    await Post.create({ user, body: 'world' })

    const min = await Post.min('id')
    expect(min).toEqual(post1.id)
  })

  context('with a field passed which requires marshaling', () => {
    it('marshals the value to the correct type', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const post1 = await Post.create({ user, body: 'universe' })
      await Post.create({ user, body: 'world' })
      await Post.create({ user, body: 'world' })

      const min = await Post.min('createdAt')
      expect(min).toEqual(post1.createdAt)
    })
  })

  context('with a field passed in which all records are null', () => {
    it('returns null', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      await Post.create({ user, body: null })
      await Post.create({ user, body: null })

      const min = await Post.min('body')
      expect(min).toBeNull()
    })
  })

  context('with a where statement passed', () => {
    context('with a similarity operator passed', () => {
      it('respects the similarity operator', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        await Post.create({ user, body: 'universe' })
        const post2 = await Post.create({ user, body: 'world' })
        await Post.create({ user, body: 'world' })

        const min = await Post.where({ body: ops.similarity('world') }).min('id')

        expect(min).toEqual(post2.id)
      })
    })
  })

  context('hasMany', () => {
    it('returns the min', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      await CompositionAsset.create({ composition, score: 7 })
      await CompositionAsset.create({ composition, score: 3 })

      const min = await composition.associationQuery('compositionAssets').min('score')

      expect(min).toEqual(3)
    })

    context('polymorphic hasMany', () => {
      it('returns the min', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })

        const post1 = await Post.create({ user })
        const post2 = await Post.create({ user })

        await Rating.create({ user, rateable: post1, rating: 3 })
        await Rating.create({ user, rateable: post1, rating: 4 })
        await Rating.create({ user, rateable: post2, rating: 1 })
        await Rating.create({ user, rateable: post1, rating: 2 })

        const min = await post1.associationQuery('ratings').min('rating')

        expect(min).toEqual(2)
      })
    })
  })

  context('hasMany through', () => {
    it('returns the min', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition1 = await Composition.create({ user })
      const composition2 = await Composition.create({ user })

      await CompositionAsset.create({ composition: composition1, score: 7 })
      await CompositionAsset.create({ composition: composition2, score: 3 })

      const min = await user.associationQuery('compositionAssets').min('score')

      expect(min).toEqual(3)
    })
  })

  context('on a join', () => {
    it('returns the min field, first traveling through nested associations', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      await CompositionAsset.create({ composition, score: 7 })
      await CompositionAsset.create({ composition, score: 3 })

      const min = await Composition.query().innerJoin('compositionAssets').min('compositionAssets.score')

      expect(min).toEqual(3)
    })

    context('when passed a where clause', () => {
      it('respects the where clause', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        const composition = await Composition.create({ user })

        await CompositionAsset.create({ composition, name: 'howyadoin', score: 7 })
        await CompositionAsset.create({ composition, score: 3 })

        const min = await Composition.query()
          .innerJoin('compositionAssets', { on: { name: 'howyadoin' } })
          .min('compositionAssets.score')

        expect(min).toEqual(7)
      })
    })

    context('when passed a transaction', () => {
      it('returns the min, traveling through nested associations', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        const composition = await Composition.create({ user })

        await CompositionAsset.create({ composition, score: 7 })
        let min = await CompositionAsset.min('score')
        expect(min).toEqual(7)

        await ApplicationModel.transaction(async txn => {
          await CompositionAsset.txn(txn).create({ composition, score: 3 })

          min = await Composition.query()
            .txn(txn)
            .innerJoin('compositionAssets')
            .min('compositionAssets.score')
        })

        expect(min).toEqual(3)
      })
    })
  })
})
