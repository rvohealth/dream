import User from '../../../../test-app/app/models/User'
import Composition from '../../../../test-app/app/models/Composition'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import CompositionAssetAudit from '../../../../test-app/app/models/CompositionAssetAudit'
import { DateTime } from 'luxon'
import Latex from '../../../../test-app/app/models/Balloon/Latex'
import BalloonSpotter from '../../../../test-app/app/models/BalloonSpotter'
import BalloonSpotterBalloon from '../../../../test-app/app/models/BalloonSpotterBalloon'
import MissingThroughAssociationSource from '../../../../src/exceptions/associations/missing-through-association-source'
import JoinAttemptedOnMissingAssociation from '../../../../src/exceptions/associations/join-attempted-with-missing-association'
import ops from '../../../../src/ops'
import Pet from '../../../../test-app/app/models/Pet'
import Post from '../../../../test-app/app/models/Post'
import Rating from '../../../../test-app/app/models/Rating'

describe('Query#joins through with simple associations', () => {
  context('explicit HasMany through', () => {
    it('sets HasMany property on the model and BelongsToProperty on the associated model', async () => {
      await BalloonSpotter.create()
      const balloon = await Latex.create()
      const balloonSpotter = await BalloonSpotter.create()
      await BalloonSpotterBalloon.create({ balloonSpotter, balloon })

      const reloaded = await BalloonSpotter.query().joins('balloonSpotterBalloons', 'balloon').all()
      expect(reloaded).toMatchDreamModels([balloonSpotter])
    })
  })

  context('implicit HasMany through', () => {
    it('sets HasMany property and through property on the model and BelongsToProperty on the associated model', async () => {
      await BalloonSpotter.create()
      const balloon = await Latex.create()
      const balloonSpotter = await BalloonSpotter.create()
      await BalloonSpotterBalloon.create({ balloonSpotter, balloon })

      const reloaded = await BalloonSpotter.query().joins('balloons').all()
      expect(reloaded).toMatchDreamModels([balloonSpotter])
    })
  })

  it('joins a HasOne through HasOne association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ userId: user.id, primary: true })
    await CompositionAsset.create({
      compositionId: composition.id,
      primary: true,
    })

    const reloadedUsers = await User.query().joins('mainCompositionAsset').all()
    expect(reloadedUsers).toMatchDreamModels([user])
  })

  it('joins a HasMany through HasMany association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ userId: user.id })
    await CompositionAsset.create({ compositionId: composition.id })

    const reloadedUsers = await User.query().joins('compositionAssets').all()
    expect(reloadedUsers).toMatchDreamModels([user])
  })

  context('nested through associations', () => {
    it('joins a HasMany through another through association', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ userId: user.id })
      const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })
      await CompositionAssetAudit.create({
        compositionAssetId: compositionAsset.id,
      })

      const reloadedUsers = await User.query().joins('compositionAssetAudits').all()
      expect(reloadedUsers).toMatchDreamModels([user])
    })
  })

  describe('with where clause', () => {
    context('HasOne through HasOne', () => {
      it('joins', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ userId: user.id, primary: true })
        const compositionAsset = await CompositionAsset.create({
          compositionId: composition.id,
          primary: true,
        })

        const reloadedUsers = await User.query()
          .joins('mainCompositionAsset', { id: compositionAsset.id })
          .all()
        expect(reloadedUsers).toMatchDreamModels([user])

        const noResults = await User.query()
          .joins('mainCompositionAsset', { id: parseInt(compositionAsset.id!.toString()) + 1 })
          .all()
        expect(noResults).toEqual([])
      })

      context('with a similarity operator', () => {
        beforeEach(async () => {
          const foreignUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const foreignComposition = await Composition.create({
            user: foreignUser,
            primary: true,
          })
          await CompositionAsset.create({
            compositionId: foreignComposition.id,
            primary: true,
            name: 'goodbye',
          })
        })

        it('filters out results that do not match similarity text', async () => {
          const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
          const composition = await Composition.create({
            userId: user.id,
            primary: true,
          })
          await CompositionAsset.create({
            compositionId: composition.id,
            primary: true,
            name: 'hello',
          })

          const reloadedUsers = await User.query()
            .joins('mainCompositionAsset', { name: ops.similarity('hell') })
            .all()
          expect(reloadedUsers).toMatchDreamModels([user])
        })
      })

      context('with another association after the where clause', () => {
        it('joins', async () => {
          await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
          const composition = await Composition.create({ userId: user.id, primary: true })
          await CompositionAsset.create({
            compositionId: composition.id,
            primary: true,
          })

          const reloadedUsers = await User.query()
            .joins('compositions', { id: composition.id }, 'compositionAssets')
            .all()
          expect(reloadedUsers).toMatchDreamModels([user])

          const noResults = await User.query()
            .joins('compositions', { id: parseInt(composition.id!.toString()) + 1 }, 'compositionAssets')
            .all()
          expect(noResults).toEqual([])
        })
      })
    })

    context('HasOne through BelongsTo', () => {
      it('joins', async () => {
        const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const otherComposition = await Composition.create({ userId: otherUser.id })
        await CompositionAsset.create({ compositionId: otherComposition.id })

        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ userId: user.id })
        const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })

        const reloadedCompositionAssets = await CompositionAsset.query().joins('user', { id: user.id }).all()
        expect(reloadedCompositionAssets).toMatchDreamModels([compositionAsset])

        const noResults = await CompositionAsset.query()
          .joins('user', { id: parseInt(user.id!.toString()) + 1 })
          .all()
        expect(noResults).toEqual([])
      })
    })

    context('HasMany through HasMany', () => {
      it('joins a HasMany through HasMany association', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ userId: user.id })
        const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })

        const reloadedUsers = await User.query().joins('compositionAssets', { id: compositionAsset.id }).all()
        expect(reloadedUsers).toMatchDreamModels([user])

        const noResults = await User.query()
          .joins('compositionAssets', { id: parseInt(compositionAsset.id!.toString()) + 1 })
          .all()
        expect(noResults).toEqual([])
      })
    })

    context('nested through associations', () => {
      it('joins a HasMany through another through association', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ userId: user.id })
        const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })
        const compositionAssetAudit = await CompositionAssetAudit.create({
          compositionAssetId: compositionAsset.id,
        })

        const reloadedUsers = await User.query()
          .joins('compositionAssetAudits', { id: compositionAssetAudit.id })
          .all()
        expect(reloadedUsers).toMatchDreamModels([user])

        const noResults = await User.query()
          .joins('compositionAssetAudits', { id: parseInt(compositionAssetAudit.id!.toString()) + 1 })
          .all()
        expect(noResults).toEqual([])
      })
    })
  })

  context('with a where-clause-on-the-through-association', () => {
    context('explicit through', () => {
      context('join models that match the where clause', () => {
        it('are included in the join', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const recentComposition = await Composition.create({ user })

          const compositionAsset = await CompositionAsset.create({
            name: 'Hello',
            composition: recentComposition,
          })

          const reloadedUser = await User.joins('recentCompositions', 'compositionAssets', {
            name: compositionAsset.name,
          }).first()
          expect(reloadedUser).toMatchDreamModel(user)
        })

        context('with a deep similarity operator', () => {
          it('joins', async () => {
            const user1 = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
            const composition1 = await Composition.create({ user: user1 })
            const compositionAsset1 = await CompositionAsset.create({
              compositionId: composition1.id,
              primary: true,
            })
            await CompositionAssetAudit.create({
              compositionAsset: compositionAsset1,
              notes: 'Hello',
            })

            const user2 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
            const composition2 = await Composition.create({ user: user2 })
            const compositionAsset2 = await CompositionAsset.create({
              compositionId: composition2.id,
              primary: true,
            })
            await CompositionAssetAudit.create({
              compositionAsset: compositionAsset2,
              notes: 'Goodbye',
            })

            const reloadedUsers = await User.query()
              .joins('compositions', 'compositionAssets', 'compositionAssetAudits', {
                notes: ops.similarity('hallo'),
              })
              .all()
            expect(reloadedUsers).toMatchDreamModels([user1])
          })

          context('with an association after the conditions', () => {
            it('joins', async () => {
              const user1 = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
              const composition1 = await Composition.create({ user: user1 })
              const compositionAsset1 = await CompositionAsset.create({
                compositionId: composition1.id,
                primary: true,
                name: 'hello',
              })
              await CompositionAssetAudit.create({
                compositionAsset: compositionAsset1,
                notes: 'Hello',
              })

              const user2 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
              const composition2 = await Composition.create({ user: user2 })
              const compositionAsset2 = await CompositionAsset.create({
                compositionId: composition2.id,
                primary: true,
                name: 'gabye',
              })
              await CompositionAssetAudit.create({
                compositionAsset: compositionAsset2,
                notes: 'Goodbye',
              })

              const reloadedUsers = await User.query()
                .joins(
                  'compositions',
                  'compositionAssets',
                  { name: ops.similarity('hallo') },
                  'compositionAssetAudits',
                  {
                    notes: ops.similarity('hallo'),
                  }
                )
                .all()
              expect(reloadedUsers).toMatchDreamModels([user1])
            })
          })
        })
      })

      context('join models that DO NOT match the where clause', () => {
        it('are omitted from the join', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const olderComposition = await Composition.create({
            user,
            createdAt: DateTime.now().minus({ year: 1 }),
          })

          const compositionAsset = await CompositionAsset.create({
            name: 'World',
            composition: olderComposition,
          })

          const reloadedUser = await User.joins('recentCompositions', 'compositionAssets', {
            name: compositionAsset.name,
          }).first()
          expect(reloadedUser).toBeNull()
        })
      })
    })

    context('implicit through', () => {
      context('join models that match the where clause', () => {
        it('are included in the join', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const recentComposition = await Composition.create({ user })

          await CompositionAsset.create({
            name: 'Hello',
            composition: recentComposition,
          })

          const reloadedUser = await User.joins('recentCompositionAssets', { name: 'Hello' }).first()
          expect(reloadedUser).toMatchDreamModel(user)
        })

        context('HasMany through a HasMany that HasOne', () => {
          it('are included in the join', async () => {
            const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
            const recentComposition = await Composition.create({ user })

            await CompositionAsset.create({
              name: 'Hello',
              composition: recentComposition,
              primary: true,
            })

            const reloadedUser = await User.joins('recentCompositionAssets', { name: 'Hello' }).first()
            expect(reloadedUser).toMatchDreamModel(user)
          })
        })
      })

      context('join models that DO NOT match the where clause', () => {
        it('are omitted from the join', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const olderComposition = await Composition.create({
            user,
            createdAt: DateTime.now().minus({ year: 1 }),
          })

          await CompositionAsset.create({
            name: 'World',
            composition: olderComposition,
          })

          const reloadedUser = await User.joins('recentCompositionAssets', { name: 'World' }).first()
          expect(reloadedUser).toBeNull()
        })

        context('HasMany through a HasMany that HasOne', () => {
          it('are omitted from the join', async () => {
            const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
            const olderComposition = await Composition.create({
              user,
              createdAt: DateTime.now().minus({ year: 1 }),
            })

            await CompositionAsset.create({
              name: 'World',
              composition: olderComposition,
              primary: true,
            })

            const reloadedUser = await User.joins('recentCompositionAssets', { name: 'World' }).first()
            expect(reloadedUser).toBeNull()
          })
        })
      })
    })
  })

  context('with a where clause on an implicit through association', () => {
    it('applies conditional to selectively bring in records', async () => {
      const pet = await Pet.create()
      const redBalloon = await Latex.create({ color: 'red' })
      const greenBalloon = await Latex.create({ color: 'green' })

      await pet.createAssociation('collars', { balloon: redBalloon })
      await pet.createAssociation('collars', { balloon: greenBalloon })

      const ids = await pet.pluckThrough('redBalloons', ['redBalloons.id'])
      expect(ids).toEqual([redBalloon.id])
    })
  })

  context('with a selfWhere clause', () => {
    it('applies conditional to selectively bring in records', async () => {
      const user = await User.create({
        email: 'fred@frewd',
        password: 'howyadoin',
        featuredPostPosition: 2,
      })

      // position is automatically set by sortable
      await Post.create({ user, body: 'hello' })
      const post2 = await Post.create({ user, body: 'world' })

      const plucked = await User.query().pluckThrough('featuredPost', [
        'featuredPost.id',
        'featuredPost.body',
      ])
      expect(plucked).toEqual([[post2.id, 'world']])
    })

    context('when the selfWhere is declared on the join association', () => {
      it('applies conditional to selectively bring in records', async () => {
        const user = await User.create({
          email: 'fred@frewd',
          password: 'howyadoin',
          targetRating: 7,
        })
        const post1 = await Post.create({ user })
        await Rating.create({ user, rateable: post1, rating: 3 })
        const rating1b = await Rating.create({ user, rateable: post1, rating: 7 })
        const post2 = await Post.create({ user })
        const rating2a = await Rating.create({ user, rateable: post2, rating: 7 })
        await Rating.create({ user, rateable: post2, rating: 5 })

        const plucked = await User.query().pluckThrough('ratingsThroughPostsThatMatchUserTargetRating', [
          'ratingsThroughPostsThatMatchUserTargetRating.id',
          'ratingsThroughPostsThatMatchUserTargetRating.rating',
        ])
        expect(plucked).toHaveLength(2)
        expect(plucked).toEqual(
          expect.arrayContaining([
            [rating1b.id, 7],
            [rating2a.id, 7],
          ])
        )
      })
    })
  })

  context('with a whereNot clause on an implicit through association', () => {
    it('applies conditional to selectively bring in records', async () => {
      const pet = await Pet.create()
      const redBalloon = await Latex.create({ color: 'red' })
      const greenBalloon = await Latex.create({ color: 'green' })
      const blueBalloon = await Latex.create({ color: 'blue' })

      await pet.createAssociation('collars', { balloon: redBalloon })
      await pet.createAssociation('collars', { balloon: greenBalloon })
      await pet.createAssociation('collars', { balloon: blueBalloon })

      const ids = await pet.pluckThrough('notRedBalloons', ['notRedBalloons.id'])
      expect(ids).toEqual([greenBalloon.id, blueBalloon.id])
    })
  })

  context('with a missing source', () => {
    it('throws MissingThroughAssociationSource', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const query = User.query().joins('nonExtantCompositionAssets1').first()

      await expect(query).rejects.toThrow(JoinAttemptedOnMissingAssociation)
    })
  })

  context('with a missing source', () => {
    it('throws MissingThroughAssociationSource', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const query = User.query().joins('nonExtantCompositionAssets2').first()

      await expect(query).rejects.toThrow(MissingThroughAssociationSource)
    })
  })
})
