import User from '../../../test-app/app/models/user'
import Composition from '../../../test-app/app/models/composition'
import CompositionAsset from '../../../test-app/app/models/composition-asset'
import CompositionAssetAudit from '../../../test-app/app/models/composition-asset-audit'

describe('Query#includes', () => {
  it('loads a HasOne association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })

    // await User.limit(1)
    //   .includes('mainComposition', { compositionAssetAudits: ['compositionAsset'] })
    //   .first()
    // expect(reloadedUser!.mainComposition).toMatchObject(composition)

    const reloadedUser = await User.limit(1).includes('mainComposition').first()
    expect(reloadedUser!.mainComposition).toMatchObject(composition)
  })

  it('loads a HasMany association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition1 = await Composition.create({ user_id: user.id })
    const composition2 = await Composition.create({ user_id: user.id })

    const reloadedUser = await User.limit(1).includes('compositions').first()
    expect(reloadedUser!.compositions[0]).toMatchObject(composition1)
    expect(reloadedUser!.compositions[1]).toMatchObject(composition2)
  })

  it('loads a BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await Composition.create({ user_id: user.id })
    const reloadedComposition = await Composition.limit(1).includes('user').first()
    expect(reloadedComposition!.user).toMatchObject(user)
  })

  context('when passed an object', () => {
    it('loads specified associations', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

      const reloadedUser = await User.limit(1).includes({ mainComposition: 'compositionAssets' }).first()
      expect(reloadedUser!.mainComposition).toMatchObject(composition)
      expect(reloadedUser!.mainComposition.compositionAssets).toMatchObject([compositionAsset])
    })
  })

  context('when passed an array', () => {
    it('loads specified associations', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const composition2 = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

      const reloadedUser = await User.limit(1)
        .includes(['compositions', { mainComposition: 'compositionAssets' }])
        .first()

      expect(reloadedUser!.mainComposition).toMatchObject(composition)
      expect(reloadedUser!.compositions).toMatchObject([composition, composition2])
      expect(reloadedUser!.mainComposition.compositionAssets).toMatchObject([compositionAsset])
    })
  })

  describe('through associations', () => {
    // it.only('loads a HasOne through HasMany association', async () => {
    //   const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    //   const composition = await Composition.create({ user_id: user.id })
    //   const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

    //   const reloadedUser = await User.limit(1).includes('mainCompositionAsset').first()
    //   expect(reloadedUser!.mainCompositionAsset).toEqual(compositionAsset)
    //   expect(reloadedUser!.compositions).toEqual([composition])
    //   expect(reloadedUser!.compositions[0].compositionAssets).toEqual([compositionAsset])
    // })

    //   it('loads a HasOne through BelongsTo association', async () => {
    //     const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    //     const composition = await Composition.create({ user_id: user.id })
    //     const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

    //     await compositionAsset.load('user')
    //     expect(compositionAsset.user!.isDreamInstance).toEqual(true)
    //     expect(compositionAsset.user!.attributes).toEqual(user.attributes)
    //   })

    it('loads a HasMany through HasMany association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

      const reloadedUser = await User.limit(1).includes('compositionAssets').first()
      expect(reloadedUser!.compositions).toMatchObject([composition])
      expect(reloadedUser!.compositions[0].compositionAssets).toEqual([compositionAsset])
      expect(reloadedUser!.compositionAssets).toEqual([compositionAsset])
    })

    //   describe('nested through associations', () => {
    //     it('loads a HasMany through another through association', async () => {
    //       const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    //       const composition = await Composition.create({ user_id: user.id })
    //       const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
    //       const compositionAssetAudit = await CompositionAssetAudit.create({
    //         composition_asset_id: compositionAsset.id,
    //       })

    //       await user.load('compositionAssetAudits')
    //       expect(user.compositionAssetAudits![0].isDreamInstance).toEqual(true)
    //       expect(user.compositionAssetAudits![0].attributes).toEqual(compositionAssetAudit.attributes)
    //     })

    //     it('loads a HasOne through another through association', async () => {
    //       const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    //       const composition = await Composition.create({ user_id: user.id })
    //       const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
    //       const compositionAssetAudit = await CompositionAssetAudit.create({
    //         composition_asset_id: compositionAsset.id,
    //       })

    //       await user.load('mainCompositionAssetAudit')
    //       expect(user.mainCompositionAssetAudit!.isDreamInstance).toEqual(true)
    //       expect(user.mainCompositionAssetAudit!.attributes).toEqual(compositionAssetAudit.attributes)
    //     })
    //   })
  })
})
