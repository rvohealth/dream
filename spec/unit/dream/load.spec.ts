import User from '../../../test-app/app/models/user'
import Composition from '../../../test-app/app/models/composition'
import CompositionAsset from '../../../test-app/app/models/composition-asset'
import CompositionAssetAudit from '../../../test-app/app/models/composition-asset-audit'

describe('Dream#load', () => {
  it('loads a HasOne association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
    const compositionAssetAudit = await CompositionAssetAudit.create({
      composition_asset_id: compositionAsset.id,
    })

    await compositionAssetAudit.load('compositionAsset')
    expect(compositionAssetAudit!.compositionAsset).toMatchObject(compositionAsset)
  })

  it('loads a HasMany association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition1 = await Composition.create({ user_id: user.id })
    const composition2 = await Composition.create({ user_id: user.id })

    await user.load('compositions')
    expect(user.compositions[0]!).toMatchObject(composition1)
    expect(user.compositions[1]!).toMatchObject(composition2)
  })

  it('can sideload multiple associations at once', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
    const compositionAssetAudit = await CompositionAssetAudit.create({
      composition_asset_id: compositionAsset.id,
    })

    await compositionAssetAudit.load('composition', 'user')
    expect(compositionAssetAudit!.composition).toMatchObject(composition)
    expect(compositionAssetAudit!.user).toMatchObject(user)
  })

  it('can handle an array of associations being passed', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
    const compositionAssetAudit = await CompositionAssetAudit.create({
      composition_asset_id: compositionAsset.id,
    })

    await compositionAssetAudit.load(['composition', 'user'])
    expect(compositionAssetAudit!.composition).toMatchObject(composition)
    expect(compositionAssetAudit!.user).toMatchObject(user)
  })

  it('can handle object notation', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

    await user.load({ compositions: ['compositionAssets'] })
    expect(user!.compositions).toMatchObject([composition])
    expect(user!.compositions[0].compositionAssets).toMatchObject([compositionAsset])
  })

  it('loads a BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })

    await composition.load('user')
    expect(composition.user).toMatchObject(user)
  })

  describe('through associations', () => {
    it('loads a HasOne through BelongsTo association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

      await compositionAsset.load('user')
      expect(compositionAsset.user!).toMatchObject(user)
    })

    it('loads a HasMany through HasMany association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

      await user.load('compositionAssets')
      expect(user.compositionAssets[0]!).toMatchObject(compositionAsset)
    })

    describe('nested through associations', () => {
      it('loads a HasOne through HasOne association', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user_id: user.id })
        await CompositionAsset.create({ composition_id: composition.id })
        const compositionAsset = await CompositionAsset.create({
          composition_id: composition.id,
          primary: true,
        })

        await user.load('mainCompositionAsset')
        expect(user!.mainCompositionAsset).toMatchObject(compositionAsset)
        expect(user!.mainComposition).toMatchObject(composition)
        expect(user!.mainComposition.mainCompositionAsset).toMatchObject(compositionAsset)
      })

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

      it('loads a HasMany through a HasMany through a HasOne', async () => {
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
        expect(compositionAssetAudit!.user).toMatchObject(user)
      })
    })
  })
})
