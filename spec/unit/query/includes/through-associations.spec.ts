import User from '../../../../test-app/app/models/user'
import Composition from '../../../../test-app/app/models/composition'
import CompositionAsset from '../../../../test-app/app/models/composition-asset'
import CompositionAssetAudit from '../../../../test-app/app/models/composition-asset-audit'

describe('Query#includes through with simple associations', () => {
  it('loads a HasOne through HasOne association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    await CompositionAsset.create({ composition_id: composition.id })
    const compositionAsset = await CompositionAsset.create({
      composition_id: composition.id,
      primary: true,
    })

    const reloadedUser = await User.limit(1).includes('mainCompositionAsset').first()
    expect(reloadedUser!.mainCompositionAsset).toMatchObject(compositionAsset)
    expect(reloadedUser!.mainComposition).toMatchObject(composition)
    expect(reloadedUser!.mainComposition.mainCompositionAsset).toMatchObject(compositionAsset)
  })

  context('with NON-matching where-clause-on-the-association', () => {
    it('does not load the associated object', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      await CompositionAsset.create({ composition_id: composition.id })
      const compositionAsset = await CompositionAsset.create({
        composition_id: composition.id,
        primary: false,
      })

      const reloadedUser = await User.limit(1).includes('mainCompositionAsset').first()
      expect(reloadedUser!.mainCompositionAsset).toBeUndefined()
      expect(reloadedUser!.mainComposition).toMatchObject(composition)
    })
  })

  it('loads a HasOne through BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    await CompositionAsset.create({ composition_id: composition.id })

    const reloadedCompositionAsset = await CompositionAsset.limit(2).includes('user').first()
    expect(reloadedCompositionAsset!.composition).toMatchObject(composition)
    expect(reloadedCompositionAsset!.user).toMatchObject(user)
  })

  it('loads a HasMany through HasMany association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

    const reloadedUser = await User.limit(1).includes('compositionAssets').first()
    expect(reloadedUser!.compositions).toMatchDreamModels([composition])
    expect(reloadedUser!.compositions[0].compositionAssets).toEqual([compositionAsset])
    expect(reloadedUser!.compositionAssets).toEqual([compositionAsset])
  })

  context('nested through associations', () => {
    it('loads a HasMany through a HasMany through a HasMany', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
      const compositionAssetAudit = await CompositionAssetAudit.create({
        composition_asset_id: compositionAsset.id,
      })

      const reloadedUser = await User.limit(3).includes('compositionAssetAudits').first()
      expect(reloadedUser!.compositionAssetAudits).toMatchDreamModels([compositionAssetAudit])
    })

    it('loads a HasOne through a HasOne through a BelongsTo', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
      await CompositionAssetAudit.create({
        composition_asset_id: compositionAsset.id,
      })

      const reloaded = await CompositionAssetAudit.limit(3).includes('user').first()
      expect(reloaded!.user).toMatchObject(user)
    })
  })
})
