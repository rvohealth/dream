import User from '../../../../test-app/app/models/user'
import Composition from '../../../../test-app/app/models/composition'
import CompositionAsset from '../../../../test-app/app/models/composition-asset'
import CompositionAssetAudit from '../../../../test-app/app/models/composition-asset-audit'

describe('Dream#load through with simple associations', () => {
  it('loads a HasOne through HasOne association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    await CompositionAsset.create({ composition_id: composition.id })
    const compositionAsset = await CompositionAsset.create({
      composition_id: composition.id,
      primary: true,
    })

    await user.load('mainCompositionAsset')
    expect(user.mainCompositionAsset).toMatchObject(compositionAsset)
    expect(user.mainComposition).toMatchObject(composition)
    expect(user.mainComposition.mainCompositionAsset).toMatchObject(compositionAsset)
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

      await user.load('mainCompositionAsset')
      expect(user.mainCompositionAsset).toBeUndefined()
      expect(user.mainComposition).toMatchObject(composition)
    })
  })

  it('loads a HasOne through BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

    await compositionAsset.load('user')
    expect(compositionAsset.composition).toMatchObject(composition)
    expect(compositionAsset.user).toMatchObject(user)
  })

  it('loads a HasMany through HasMany association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

    await user.load('compositionAssets')
    expect(user.compositions).toMatchObject([composition])
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
      expect(user.compositionAssetAudits).toMatchObject([compositionAssetAudit])
    })

    it('loads a HasOne through a HasOne through a BelongsTo', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
      const compositionAssetAudit = await CompositionAssetAudit.create({
        composition_asset_id: compositionAsset.id,
      })

      await compositionAssetAudit.load('user')
      expect(compositionAssetAudit.user).toMatchObject(user)
    })
  })
})
