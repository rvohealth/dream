import ops from '../../../src/ops/index.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset.js'
import Post from '../../../test-app/app/models/Post.js'
import Rating from '../../../test-app/app/models/Rating.js'
import User from '../../../test-app/app/models/User.js'

describe('Query#max', () => {
  it('returns the record with the highest value', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
    await Post.create({ user, body: 'universe' })
    await Post.create({ user, body: 'world' })
    const post3 = await Post.create({ user, body: 'world' })

    const max = await Post.max('id')
    expect(max).toEqual(post3.id)
  })

  context('with a field passed which requires marshaling', () => {
    it('marshals the value to the correct type', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      await Post.create({ user, body: 'universe' })
      await Post.create({ user, body: 'world' })
      const post3 = await Post.create({ user, body: 'world' })

      const max = await Post.max('createdAt')
      expect(max).toEqual(post3.createdAt)
    })
  })

  context('with a field passed in which all records are null', () => {
    it('returns null', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      await Post.create({ user, body: null })
      await Post.create({ user, body: null })

      const max = await Post.max('body')
      expect(max).toBeNull()
    })
  })

  context('with a where statement passed', () => {
    context('with a similarity operator passed', () => {
      it('respects the similarity operator', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        await Post.create({ user, body: 'universe' })
        await Post.create({ user, body: 'world' })
        const post3 = await Post.create({ user, body: 'world' })

        const max = await Post.where({ body: ops.similarity('world') }).max('id')

        expect(max).toEqual(post3.id)
      })
    })
  })

  context('hasMany', () => {
    it('returns the max', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      await CompositionAsset.create({ composition, score: 7 })
      await CompositionAsset.create({ composition, score: 3 })

      const max = await composition.associationQuery('compositionAssets').max('score')

      expect(max).toEqual(7)
    })

    context('with a polymorphic association', () => {
      it('returns the max', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })

        const post1 = await Post.create({ user })
        const post2 = await Post.create({ user })

        await Rating.create({ user, rateable: post1, rating: 3 })
        await Rating.create({ user, rateable: post1, rating: 4 })
        await Rating.create({ user, rateable: post2, rating: 5 })
        await Rating.create({ user, rateable: post1, rating: 2 })

        const max = await post1.associationQuery('ratings').max('rating')

        expect(max).toEqual(4)
      })
    })
  })

  context('hasMany through', () => {
    it('returns the max', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition1 = await Composition.create({ user })
      const composition2 = await Composition.create({ user })

      await CompositionAsset.create({ composition: composition1, score: 7 })
      await CompositionAsset.create({ composition: composition2, score: 3 })

      const max = await user.associationQuery('compositionAssets').max('score')

      expect(max).toEqual(7)
    })
  })

  context('on a join', () => {
    it('returns the max field, first traveling through nested associations', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const composition = await Composition.create({ user })

      await CompositionAsset.create({ composition, score: 7 })
      await CompositionAsset.create({ composition, score: 3 })

      const max = await Composition.query().innerJoin('compositionAssets').max('compositionAssets.score')

      expect(max).toEqual(7)
    })

    context('when passed a where clause', () => {
      it('respects the where clause', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        const composition = await Composition.create({ user })

        await CompositionAsset.create({ composition, score: 7 })
        await CompositionAsset.create({ composition, name: 'howyadoin', score: 3 })

        const max = await Composition.query()
          .innerJoin('compositionAssets', { and: { name: 'howyadoin' } })
          .max('compositionAssets.score')

        expect(max).toEqual(3)
      })
    })

    context('when passed a transaction', () => {
      it('returns the max, traveling through nested associations', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        const composition = await Composition.create({ user })

        await CompositionAsset.create({ composition, score: 3 })
        let max = await CompositionAsset.max('score')
        expect(max).toEqual(3)

        await ApplicationModel.transaction(async txn => {
          await CompositionAsset.txn(txn).create({ composition, score: 7 })

          max = await Composition.query()
            .txn(txn)
            .innerJoin('compositionAssets')
            .max('compositionAssets.score')
        })

        expect(max).toEqual(7)
      })
    })
  })
})
