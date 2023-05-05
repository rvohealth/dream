import User from '../../../../test-app/app/models/User'
import Composition from '../../../../test-app/app/models/Composition'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import CompositionAssetAudit from '../../../../test-app/app/models/CompositionAssetAudit'

describe('Dream#load through with simple associations', () => {
  it('loads a HasOne through HasOne association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id, primary: true })
    await CompositionAsset.create({ composition_id: composition.id })
    const compositionAsset = await CompositionAsset.create({
      composition_id: composition.id,
      primary: true,
    })

    await user.load('mainCompositionAsset')
    expect(user.mainCompositionAsset).toMatchDreamModel(compositionAsset)
    expect(user.mainComposition).toMatchDreamModel(composition)
    expect(user.mainComposition.mainCompositionAsset).toMatchDreamModel(compositionAsset)
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

      await user.load('mainCompositionAsset')
      expect(user.mainCompositionAsset).toBeUndefined()
      expect(user.mainComposition).toMatchDreamModel(composition)
    })
  })

  it('loads a HasOne through BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

    await compositionAsset.load('user')
    expect(compositionAsset.composition).toMatchDreamModel(composition)
    expect(compositionAsset.user).toMatchDreamModel(user)
  })

  it('loads a HasMany through HasMany association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

    await user.load('compositionAssets')
    expect(user.compositions).toMatchDreamModels([composition])
    expect(user.compositions[0].compositionAssets).toEqual([compositionAsset])
    expect(user.compositionAssets).toEqual([compositionAsset])
  })

  context('nested through associations', () => {
    it('loads a HasMany through a HasMany through a HasMany', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
      const compositionAssetAudit = await CompositionAssetAudit.create({
        composition_asset_id: compositionAsset.id,
      })

      await user.load('compositionAssetAudits')
      expect(user.compositionAssetAudits).toMatchDreamModels([compositionAssetAudit])
    })

    it('loads a HasOne through a HasOne through a BelongsTo', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
      const compositionAssetAudit = await CompositionAssetAudit.create({
        composition_asset_id: compositionAsset.id,
      })

      await compositionAssetAudit.load('user')
      expect(compositionAssetAudit.user).toMatchDreamModel(user)
    })
  })
})
