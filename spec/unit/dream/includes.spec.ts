import User from '../../../test-app/app/models/user'
import Composition from '../../../test-app/app/models/composition'
import CompositionAsset from '../../../test-app/app/models/composition-asset'
import CompositionAssetAudit from '../../../test-app/app/models/composition-asset-audit'

describe('Dream#includes', () => {
  it('loads a HasOne association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
    const compositionAssetAudit = await CompositionAssetAudit.create({
      composition_asset_id: compositionAsset.id,
    })

    const reloaded = await CompositionAssetAudit.includes('compositionAsset').first()
    expect(reloaded!.compositionAsset).toMatchObject(compositionAsset)
  })

  it('loads a HasMany association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition1 = await Composition.create({ user_id: user.id })
    const composition2 = await Composition.create({ user_id: user.id })

    const reloaded = await User.includes('compositions').first()
    expect(reloaded!.compositions[0]!).toMatchObject(composition1)
    expect(reloaded!.compositions[1]!).toMatchObject(composition2)
  })

  it('can sideload multiple associations at once', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
    const compositionAssetAudit = await CompositionAssetAudit.create({
      composition_asset_id: compositionAsset.id,
    })

    const reloaded = await CompositionAssetAudit.includes('composition', 'user').first()
    expect(reloaded!.composition).toMatchObject(composition)
    expect(reloaded!.user).toMatchObject(user)
  })

  it('can handle an array of associations being passed', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
    const compositionAssetAudit = await CompositionAssetAudit.create({
      composition_asset_id: compositionAsset.id,
    })

    const reloaded = await CompositionAssetAudit.includes(['composition', 'user']).first()
    expect(reloaded!.composition).toMatchObject(composition)
    expect(reloaded!.user).toMatchObject(user)
  })

  it('can handle object notation', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

    const reloaded = await User.includes({ compositions: ['compositionAssets'] }).first()
    expect(reloaded!.compositions).toMatchObject([composition])
    expect(reloaded!.compositions[0].compositionAssets).toMatchObject([compositionAsset])
  })

  it('loads a BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })

    const reloaded = await Composition.includes('user').first()
    expect(reloaded!.user).toMatchObject(user)
  })

  describe('through associations', () => {
    it('loads a HasOne through BelongsTo association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

      const reloaded = await CompositionAsset.includes('user').first()
      expect(reloaded!.user!).toMatchObject(user)
    })

    it('loads a HasMany through HasMany association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

      const reloaded = await User.includes('compositionAssets').first()
      expect(reloaded!.compositionAssets[0]!).toMatchObject(compositionAsset)
    })

    describe('nested through associations', () => {
      it('loads a HasMany through a HasMany through a HasMany', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user_id: user.id })
        const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
        const compositionAssetAudit = await CompositionAssetAudit.create({
          composition_asset_id: compositionAsset.id,
        })

        const reloaded = await User.includes('compositionAssetAudits').first()
        expect(reloaded!.compositionAssetAudits).toMatchObject([compositionAssetAudit])
      })

      it('loads a HasMany through a HasMany through a HasOne', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user_id: user.id })
        const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
        const compositionAssetAudit = await CompositionAssetAudit.create({
          composition_asset_id: compositionAsset.id,
        })

        const reloaded = await User.includes('compositionAssetAudits').first()
        expect(reloaded!.compositionAssetAudits).toMatchObject([compositionAssetAudit])
      })

      it('loads a HasOne through a HasOne through a BelongsTo', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user_id: user.id })
        const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
        const compositionAssetAudit = await CompositionAssetAudit.create({
          composition_asset_id: compositionAsset.id,
        })

        const reloaded = await CompositionAssetAudit.includes('user').first()
        expect(reloaded!.user).toMatchObject(user)
      })
    })
  })
})
