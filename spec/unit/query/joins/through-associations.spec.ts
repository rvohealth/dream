import User from '../../../../test-app/app/models/User'
import Composition from '../../../../test-app/app/models/Composition'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import CompositionAssetAudit from '../../../../test-app/app/models/CompositionAssetAudit'
import { DateTime } from 'luxon'
import Query from '../../../../src/dream/query'
import MissingThroughAssociation from '../../../../src/exceptions/missing-through-association'
import Latex from '../../../../test-app/app/models/Balloon/Latex'
import BalloonSpotter from '../../../../test-app/app/models/BalloonSpotter'
import BalloonSpotterBalloon from '../../../../test-app/app/models/BalloonSpotterBalloon'

describe('Query#joins through with simple associations', () => {
  context('HasMany via a join table', () => {
    it('sets HasMany property on the model and BelongsToProperty on the associated model', async () => {
      await BalloonSpotter.create()
      const balloon = await Latex.create()
      const balloonSpotter = await BalloonSpotter.create()
      const balloonSpotterBalloon = await BalloonSpotterBalloon.create({ balloonSpotter, balloon })

      const reloaded = await new Query(BalloonSpotter).joins({ balloonSpotterBalloons: 'balloon' }).all()
      expect(reloaded).toMatchDreamModels([balloonSpotter])
    })
  })

  context('HasMany through a join table', () => {
    it('sets HasMany property and through property on the model and BelongsToProperty on the associated model', async () => {
      await BalloonSpotter.create()
      const balloon = await Latex.create()
      const balloonSpotter = await BalloonSpotter.create()
      const balloonSpotterBalloon = await BalloonSpotterBalloon.create({ balloonSpotter, balloon })

      const reloaded = await new Query(BalloonSpotter).joins('balloons').all()
      expect(reloaded).toMatchDreamModels([balloonSpotter])
    })
  })

  it('joins a HasOne through HasOne association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id, primary: true })
    const compositionAsset = await CompositionAsset.create({
      composition_id: composition.id,
      primary: true,
    })

    const reloadedUsers = await new Query(User).joins('mainCompositionAsset').all()
    expect(reloadedUsers).toMatchDreamModels([user])
  })

  it('joins a HasMany through HasMany association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    await CompositionAsset.create({ composition_id: composition.id })

    const reloadedUsers = await new Query(User).joins('compositionAssets').all()
    expect(reloadedUsers).toMatchDreamModels([user])
  })

  context('nested through associations', () => {
    it('joins a HasMany through another through association', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
      const compositionAssetAudit = await CompositionAssetAudit.create({
        composition_asset_id: compositionAsset.id,
      })

      const reloadedUsers = await new Query(User).joins('compositionAssetAudits').all()
      expect(reloadedUsers).toMatchDreamModels([user])
    })
  })

  describe('with where clause', () => {
    it('joins a HasOne through HasOne association', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id, primary: true })
      const compositionAsset = await CompositionAsset.create({
        composition_id: composition.id,
        primary: true,
      })

      const reloadedUsers = await new Query(User)
        .joins('mainCompositionAsset')
        .where({ mainCompositionAsset: { id: compositionAsset.id } })
        .all()
      expect(reloadedUsers).toMatchDreamModels([user])

      const noResults = await new Query(User)
        .joins('mainCompositionAsset')
        .where({ mainCompositionAsset: { id: parseInt(compositionAsset.id!.toString()) + 1 } })
        .all()
      expect(noResults).toEqual([])
    })

    it('joins a HasOne through BelongsTo association', async () => {
      const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const otherComposition = await Composition.create({ user_id: otherUser.id })
      await CompositionAsset.create({ composition_id: otherComposition.id })

      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

      const reloadedCompositionAssets = await new Query(CompositionAsset)
        .joins('user')
        .where({ user: { id: user.id } })
        .all()
      expect(reloadedCompositionAssets).toMatchDreamModels([compositionAsset])

      const noResults = await new Query(CompositionAsset)
        .joins('user')
        .where({ user: { id: parseInt(user.id!.toString()) + 1 } })
        .all()
      expect(noResults).toEqual([])
    })

    it('joins a HasMany through HasMany association', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

      const reloadedUsers = await new Query(User)
        .joins('compositionAssets')
        .where({ compositionAssets: { id: compositionAsset.id } })
        .all()
      expect(reloadedUsers).toMatchDreamModels([user])

      const noResults = await new Query(User)
        .joins('compositionAssets')
        .where({ compositionAssets: { id: parseInt(compositionAsset.id!.toString()) + 1 } })
        .all()
      expect(noResults).toEqual([])
    })

    context('nested through associations', () => {
      it('joins a HasMany through another through association', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ user_id: user.id })
        const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
        const compositionAssetAudit = await CompositionAssetAudit.create({
          composition_asset_id: compositionAsset.id,
        })

        const reloadedUsers = await new Query(User)
          .joins('compositionAssetAudits')
          .where({ compositionAssetAudits: { id: compositionAssetAudit.id } })
          .all()
        expect(reloadedUsers).toMatchDreamModels([user])

        const noResults = await new Query(User)
          .joins('compositionAssetAudits')
          .where({ compositionAssetAudits: { id: parseInt(compositionAssetAudit.id!.toString()) + 1 } })
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

          const reloadedUser = await User.joins({ recentCompositions: 'compositionAssets' })
            .where({
              recentCompositions: {
                compositionAssets: { name: compositionAsset.name },
              },
            })
            .first()
          expect(reloadedUser).toMatchDreamModel(user)
        })
      })

      context('join models that DO NOT match the where clause', () => {
        it('are omitted from the join', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const olderComposition = await Composition.create({
            user,
            created_at: DateTime.now().minus({ year: 1 }),
          })

          const compositionAsset = await CompositionAsset.create({
            name: 'World',
            composition: olderComposition,
          })

          const reloadedUser = await User.joins({ recentCompositions: 'compositionAssets' })
            .where({
              recentCompositions: {
                compositionAssets: { name: compositionAsset.name },
              },
            })
            .first()
          expect(reloadedUser).toBeNull()
        })
      })
    })

    context('implicit through', () => {
      context('join models that match the where clause', () => {
        it('are included in the join', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const recentComposition = await Composition.create({ user })

          const compositionAsset1 = await CompositionAsset.create({
            name: 'Hello',
            composition: recentComposition,
          })

          const reloadedUser = await User.joins('recentCompositionAssets')
            .where({
              recentCompositionAssets: { name: 'Hello' },
            })
            .first()
          expect(reloadedUser).toMatchDreamModel(user)
        })

        context('HasMany through a HasMany that HasOne', () => {
          it('are included in the join', async () => {
            const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
            const recentComposition = await Composition.create({ user })

            const compositionAsset1 = await CompositionAsset.create({
              name: 'Hello',
              composition: recentComposition,
              primary: true,
            })

            const reloadedUser = await User.joins('recentCompositionAssets')
              .where({
                recentCompositionAssets: { name: 'Hello' },
              })
              .first()
            expect(reloadedUser).toMatchDreamModel(user)
          })
        })
      })

      context('join models that DO NOT match the where clause', () => {
        it('are omitted from the join', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const olderComposition = await Composition.create({
            user,
            created_at: DateTime.now().minus({ year: 1 }),
          })

          const compositionAsset2 = await CompositionAsset.create({
            name: 'World',
            composition: olderComposition,
          })

          const reloadedUser = await User.joins('recentCompositionAssets')
            .where({
              recentCompositionAssets: { name: 'World' },
            })
            .first()
          expect(reloadedUser).toBeNull()
        })

        context('HasMany through a HasMany that HasOne', () => {
          it('are omitted from the join', async () => {
            const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
            const olderComposition = await Composition.create({
              user,
              created_at: DateTime.now().minus({ year: 1 }),
            })

            const compositionAsset2 = await CompositionAsset.create({
              name: 'World',
              composition: olderComposition,
              primary: true,
            })

            const reloadedUser = await User.joins('recentCompositionAssets')
              .where({
                recentCompositionAssets: { name: 'World' },
              })
              .first()
            expect(reloadedUser).toBeNull()
          })
        })
      })
    })
  })

  context('with a missing source', () => {
    it('throws MissingThroughAssociation', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const query = new Query(User).joins('nonExtantCompositionAssets').first()

      await expect(query).rejects.toThrow(MissingThroughAssociation)
    })
  })
})
