import User from '../../../test-app/app/models/user'
import Composition from '../../../test-app/app/models/composition'
import CompositionAsset from '../../../test-app/app/models/composition-asset'
import CompositionAssetAudit from '../../../test-app/app/models/composition-asset-audit'

describe('Dream#load', () => {
  it('loads a HasOne association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })

    await user.load('mainComposition')
    expect(user.mainComposition.isDreamInstance).toEqual(true)
    expect(user.mainComposition!.attributes).toEqual(composition.attributes)
  })

  it('loads a HasMany association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition1 = await Composition.create({ user_id: user.id })
    const composition2 = await Composition.create({ user_id: user.id })

    await user.load('compositions')
    expect(user.compositions[0]!.isDreamInstance).toEqual(true)
    expect(user.compositions[0]!.attributes).toEqual(composition1.attributes)
    expect(user.compositions[1]!.attributes).toEqual(composition2.attributes)
  })

  it('loads a BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })

    await composition.load('user')
    expect(composition.user!.isDreamInstance).toEqual(true)
    expect(composition.user!.attributes).toEqual(user.attributes)
  })

  describe('through associations', () => {
    it('loads a HasOne through HasMany association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

      await user.load('mainCompositionAsset')
      expect(user.mainCompositionAsset!.isDreamInstance).toEqual(true)
      expect(user.mainCompositionAsset!.attributes).toEqual(compositionAsset.attributes)
    })

    it('loads a HasOne through BelongsTo association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

      await compositionAsset.load('user')
      expect(compositionAsset.user!.isDreamInstance).toEqual(true)
      expect(compositionAsset.user!.attributes).toEqual(user.attributes)
    })

    it('loads a HasMany through HasMany association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

      await user.load('compositionAssets')
      expect(user.compositionAssets[0].isDreamInstance).toEqual(true)
      expect(user.compositionAssets[0]!.attributes).toEqual(compositionAsset.attributes)
    })

    describe('nested through associations', () => {
      it('loads a HasMany through another through association', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user_id: user.id })
        const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
        const compositionAssetAudit = await CompositionAssetAudit.create({
          composition_asset_id: compositionAsset.id,
        })

        await user.load('compositionAssetAudits')
        expect(user.compositionAssetAudits![0].isDreamInstance).toEqual(true)
        expect(user.compositionAssetAudits![0].attributes).toEqual(compositionAssetAudit.attributes)
      })

      it('loads a HasOne through another through association', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user_id: user.id })
        const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
        const compositionAssetAudit = await CompositionAssetAudit.create({
          composition_asset_id: compositionAsset.id,
        })

        await user.load('mainCompositionAssetAudit')
        expect(user.mainCompositionAssetAudit!.isDreamInstance).toEqual(true)
        expect(user.mainCompositionAssetAudit!.attributes).toEqual(compositionAssetAudit.attributes)
      })
    })
  })
})
