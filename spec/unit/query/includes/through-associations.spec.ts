import User from '../../../../test-app/app/models/User'
import Composition from '../../../../test-app/app/models/Composition'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import CompositionAssetAudit from '../../../../test-app/app/models/CompositionAssetAudit'
import { DateTime } from 'luxon'
import Query from '../../../../src/dream/query'
import MissingThroughAssociation from '../../../../src/exceptions/missing-through-association'

describe('Query#includes through with simple associations', () => {
  it('loads a HasOne through HasOne association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id, primary: true })
    await CompositionAsset.create({ composition_id: composition.id })
    const compositionAsset = await CompositionAsset.create({
      composition_id: composition.id,
      primary: true,
    })

    const reloadedUser = await new Query(User).includes('mainCompositionAsset').first()
    expect(reloadedUser!.mainCompositionAsset).toMatchDreamModel(compositionAsset)
    expect(reloadedUser!.mainComposition).toMatchDreamModel(composition)
    expect(reloadedUser!.mainComposition.mainCompositionAsset).toMatchDreamModel(compositionAsset)
  })

  context('with NON-matching where-clause-on-the-association', () => {
    it('does not load the associated object', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id, primary: true })
      await CompositionAsset.create({ composition_id: composition.id })
      const compositionAsset = await CompositionAsset.create({
        composition_id: composition.id,
        primary: false,
      })

      const reloadedUser = await new Query(User).includes('mainCompositionAsset').first()
      expect(reloadedUser!.mainCompositionAsset).toBeUndefined()
      expect(reloadedUser!.mainComposition).toMatchDreamModel(composition)
    })
  })

  it('loads a HasOne through BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    await CompositionAsset.create({ composition_id: composition.id })

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
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
      const compositionAssetAudit = await CompositionAssetAudit.create({
        composition_asset_id: compositionAsset.id,
      })

      const reloadedUser = await new Query(User).includes('compositionAssetAudits').first()
      expect(reloadedUser!.compositionAssetAudits).toMatchDreamModels([compositionAssetAudit])
    })

    it('loads a HasOne through a HasOne through a BelongsTo', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
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
