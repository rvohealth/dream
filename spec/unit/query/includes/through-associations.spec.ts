import User from '../../../../test-app/app/models/User'
import Composition from '../../../../test-app/app/models/Composition'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import CompositionAssetAudit from '../../../../test-app/app/models/CompositionAssetAudit'
import { DateTime } from 'luxon'
import Query from '../../../../src/dream/query'
import MissingThroughAssociation from '../../../../src/exceptions/missing-through-association'
import BalloonSpotter from '../../../../test-app/app/models/BalloonSpotter'
import BalloonSpotterBalloon from '../../../../test-app/app/models/BalloonSpotterBalloon'
import Latex from '../../../../test-app/app/models/Balloon/Latex'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar'
import Sandbag from '../../../../test-app/app/models/Sandbag'

describe('Query#includes through with simple associations', () => {
  context('HasMany via a join table', () => {
    it('sets HasMany property on the model and BelongsToProperty on the associated model', async () => {
      const balloon = await Latex.create()
      const balloonSpotter = await BalloonSpotter.create()
      const balloonSpotterBalloon = await BalloonSpotterBalloon.create({ balloonSpotter, balloon })

      const reloaded = await new Query(BalloonSpotter).includes({ balloonSpotterBalloons: 'balloon' }).first()
      expect(reloaded!.balloonSpotterBalloons).toMatchDreamModels([balloonSpotterBalloon])
      expect(reloaded!.balloonSpotterBalloons[0].balloon).toMatchDreamModel(balloon)
    })
  })

  context('HasMany through a join table', () => {
    it('sets HasMany property and through property on the model and BelongsToProperty on the associated model', async () => {
      const balloon = await Latex.create()
      const balloonSpotter = await BalloonSpotter.create()
      const balloonSpotterBalloon = await BalloonSpotterBalloon.create({ balloonSpotter, balloon })

      const reloaded = await new Query(BalloonSpotter).includes('balloons').first()
      expect(reloaded!.balloons).toMatchDreamModels([balloon])
      expect(reloaded!.balloonSpotterBalloons).toMatchDreamModels([balloonSpotterBalloon])
      expect(reloaded!.balloonSpotterBalloons[0].balloon).toMatchDreamModel(balloon)
    })
  })

  context('HasOne through HasOne association', () => {
    it(
      'sets the association property and the association property on the through association to the ' +
        'loaded model, and the join association property to the loaded join model',
      async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user, primary: true })
        await CompositionAsset.create({ composition })
        const compositionAsset = await CompositionAsset.create({
          composition,
          primary: true,
        })

        const reloadedUser = await new Query(User).includes('mainCompositionAsset').first()
        expect(reloadedUser!.mainCompositionAsset).toMatchDreamModel(compositionAsset)
        expect(reloadedUser!.mainComposition).toMatchDreamModel(composition)
        expect(reloadedUser!.mainComposition.mainCompositionAsset).toMatchDreamModel(compositionAsset)
      }
    )

    context('when there is no associated model', () => {
      it('sets the association property and the join association property to null', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })

        const reloadedUser = await new Query(User).includes('mainCompositionAsset').first()
        expect(reloadedUser!.mainCompositionAsset).toBeNull()
        expect(reloadedUser!.mainComposition).toBeNull()
      })
    })
  })

  context('HasMany via HasOne association', () => {
    it('sets HasOne association property on the base model and the HasMany property on the assocaited model', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      const compositionAsset = await CompositionAsset.create({
        composition,
        primary: true,
      })
      const compositionAssetAudit = await CompositionAssetAudit.create({
        compositionAsset,
      })

      const reloadedComposition = await new Query(Composition)
        .includes({ mainCompositionAsset: 'compositionAssetAudits' })
        .first()
      expect(reloadedComposition!.mainCompositionAsset).toMatchDreamModel(compositionAsset)
      expect(reloadedComposition!.mainCompositionAsset.compositionAssetAudits).toMatchDreamModels([
        compositionAssetAudit,
      ])
    })

    context('when there are no models associated via the HasMany', () => {
      it('sets HasOne association property on the base model and the HasMany property on the assocaited model to an empty array', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user })
        const compositionAsset = await CompositionAsset.create({
          composition,
          primary: true,
        })

        const reloadedComposition = await new Query(Composition)
          .includes({ mainCompositionAsset: 'compositionAssetAudits' })
          .first()
        expect(reloadedComposition!.mainCompositionAsset).toMatchDreamModel(compositionAsset)
      })
    })

    context('when the join model doesn’t exist', () => {
      it('sets HasOne association property on the base model to null', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user })

        const reloadedComposition = await new Query(Composition)
          .includes({ mainCompositionAsset: 'compositionAssetAudits' })
          .first()
        expect(reloadedComposition!.mainCompositionAsset).toBeNull()
      })
    })

    context('when including an association that exists on one of the STI children and not the other', () => {
      it('sets HasOne association property on the STI child that has the association', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const latex = await Latex.create({ color: 'blue', user })
        const mylar = await Mylar.create({ color: 'red', user })
        const sandbag = await Sandbag.create({ mylar })

        const reloaded = await new Query(User).includes({ balloons: 'sandbags' }).order('id', 'asc').first()
        expect(reloaded!.balloons[0]).toMatchDreamModel(latex)
        expect(reloaded!.balloons[1]).toMatchDreamModel(mylar)
        expect((reloaded!.balloons[1] as Mylar).sandbags).toMatchDreamModels([sandbag])
      })

      context("when the query doesn't include any STI child that has the association", () => {
        it('the models without the association are loaded successfully', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const latex = await Latex.create({ color: 'blue', user })

          const reloaded = await new Query(User).includes({ balloons: 'sandbags' }).order('id', 'asc').first()
          expect(reloaded!.balloons[0]).toMatchDreamModel(latex)
        })
      })
    })
  })

  context('HasMany through HasOne association', () => {
    it('sets HasOne association property on the base model and the HasMany property on the assocaited model', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      const compositionAsset = await CompositionAsset.create({
        composition,
        primary: true,
      })
      const compositionAssetAudit = await CompositionAssetAudit.create({
        compositionAsset,
      })

      const reloadedComposition = await new Query(Composition).includes('mainCompositionAssetAudits').first()
      expect(reloadedComposition!.mainCompositionAsset).toMatchDreamModel(compositionAsset)
      expect(reloadedComposition!.mainCompositionAsset.compositionAssetAudits).toMatchDreamModels([
        compositionAssetAudit,
      ])
      expect(reloadedComposition!.mainCompositionAssetAudits).toMatchDreamModels([compositionAssetAudit])
    })

    context('when there are no models associated via the HasMany', () => {
      it('sets HasOne association property on the base model and the HasMany property on the assocaited model to an empty array', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user })
        const compositionAsset = await CompositionAsset.create({
          composition,
          primary: true,
        })

        const reloadedComposition = await new Query(Composition)
          .includes('mainCompositionAssetAudits')
          .first()
        expect(reloadedComposition!.mainCompositionAsset).toMatchDreamModel(compositionAsset)
        expect(reloadedComposition!.mainCompositionAsset.compositionAssetAudits).toEqual([])
        expect(reloadedComposition!.mainCompositionAssetAudits).toEqual([])
      })
    })
  })

  context('with NON-matching where-clause-on-the-association', () => {
    it('sets the association to null', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user, primary: true })
      await CompositionAsset.create({ composition })
      const compositionAsset = await CompositionAsset.create({
        composition,
        primary: false,
      })

      const reloadedUser = await new Query(User).includes('mainCompositionAsset').first()
      expect(reloadedUser!.mainCompositionAsset).toBeNull()
      expect(reloadedUser!.mainComposition).toMatchDreamModel(composition)
    })
  })

  it('loads a HasOne through BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user })
    await CompositionAsset.create({ composition })

    const reloadedCompositionAsset = await new Query(CompositionAsset).includes('user').first()
    expect(reloadedCompositionAsset!.composition).toMatchDreamModel(composition)
    expect(reloadedCompositionAsset!.user).toMatchDreamModel(user)
  })

  context('HasMany through HasMany association', () => {
    it('loads the included association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user, primary: true })
      const compositionAsset = await CompositionAsset.create({ composition })

      const reloadedUser = await new Query(User).includes('compositionAssets').first()
      expect(reloadedUser!.compositions).toMatchDreamModels([composition])
      expect(reloadedUser!.compositionAssets).toMatchDreamModels([compositionAsset])
      expect(reloadedUser!.compositions[0].compositionAssets).toMatchDreamModels([compositionAsset])
    })

    context('when there are no associated models', () => {
      it('sets the association to an empty array', async () => {
        await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const users = await new Query(User).includes('compositionAssets').all()
        expect(users[0].compositionAssets).toEqual([])
      })
    })
  })

  context('nested through associations', () => {
    it('loads a HasMany through a HasMany through a HasMany', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      const compositionAsset = await CompositionAsset.create({ composition })
      const compositionAssetAudit = await CompositionAssetAudit.create({
        composition_asset_id: compositionAsset.id,
      })

      const reloadedUser = await new Query(User).includes('compositionAssetAudits').first()
      expect(reloadedUser!.compositionAssetAudits).toMatchDreamModels([compositionAssetAudit])
    })

    it('loads a HasOne through a HasOne through a BelongsTo', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      const compositionAsset = await CompositionAsset.create({ composition })
      await CompositionAssetAudit.create({
        composition_asset_id: compositionAsset.id,
      })

      const reloaded = await new Query(CompositionAssetAudit).includes('user').first()
      expect(reloaded!.user).toMatchDreamModel(user)
    })
  })

  context('with a where-clause-on-the-through-association', () => {
    context('explicit through association', () => {
      it('loads objects matching the where clause', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const recentComposition = await Composition.create({ user })
        const olderComposition = await Composition.create({
          user,
          created_at: DateTime.now().minus({ year: 1 }),
        })

        const compositionAsset1 = await CompositionAsset.create({ composition: recentComposition })
        const compositionAsset2 = await CompositionAsset.create({ composition: olderComposition })

        const reloadedUser = await new Query(User)
          .includes({ recentCompositions: 'compositionAssets' })
          .first()
        expect(reloadedUser!.recentCompositions[0].compositionAssets).toMatchDreamModels([compositionAsset1])
      })
    })

    context('implicit through association', () => {
      it('loads objects matching the where clause', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const recentComposition = await Composition.create({ user })
        const olderComposition = await Composition.create({
          user,
          created_at: DateTime.now().minus({ year: 1 }),
        })

        const compositionAsset1 = await CompositionAsset.create({ composition: recentComposition })
        const compositionAsset2 = await CompositionAsset.create({ composition: olderComposition })

        const reloadedUser = await new Query(User).includes('recentCompositionAssets').first()
        expect(reloadedUser).toMatchDreamModel(user)
        expect(reloadedUser!.recentCompositionAssets).toMatchDreamModels([compositionAsset1])
      })

      context('HasMany through a HasMany that HasOne', () => {
        it('loads objects matching the where clause', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const recentComposition = await Composition.create({ user })
          const olderComposition = await Composition.create({
            user,
            created_at: DateTime.now().minus({ year: 1 }),
          })

          const compositionAsset1 = await CompositionAsset.create({
            composition: recentComposition,
            primary: true,
          })
          const compositionAsset2 = await CompositionAsset.create({
            composition: olderComposition,
            primary: true,
          })

          const reloadedUser = await new Query(User).includes('recentCompositionAssets').first()
          expect(reloadedUser).toMatchDreamModel(user)
          expect(reloadedUser!.recentCompositionAssets).toMatchDreamModels([compositionAsset1])
        })
      })
    })
  })

  context('with a missing source', () => {
    it('throws MissingThroughAssociation', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const query = new Query(User).includes('nonExtantCompositionAssets').first()

      await expect(query).rejects.toThrow(MissingThroughAssociation)
    })
  })
})
