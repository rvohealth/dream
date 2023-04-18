import User from '../../../test-app/app/models/user'
import Composition from '../../../test-app/app/models/composition'
import CompositionAsset from '../../../test-app/app/models/composition-asset'
import CompositionAssetAudit from '../../../test-app/app/models/composition-asset-audit'

describe('Query#joins', () => {
  it('joins a HasOne association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })

    const reloadedUser = await User.limit(2)
      .joins('mainComposition')
      .where({ mainComposition: { id: composition.id } })
      .first()
    expect(reloadedUser!).toMatchObject(user)
  })

  it('joins a HasMany association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition1 = await Composition.create({ user_id: user.id })
    const composition2 = await Composition.create({ user_id: user.id })

    const reloadedUser = await User.limit(1).joins('compositions').first()
    expect(reloadedUser!.compositions[0]).toMatchObject(composition1)
    expect(reloadedUser!.compositions[1]).toMatchObject(composition2)
  })

  it('joins a BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await Composition.create({ user_id: user.id })
    const reloadedComposition = await Composition.limit(1).joins('user').first()
    expect(reloadedComposition!.user).toMatchObject(user)
  })

  context('when passed an object', () => {
    it('loads specified associations', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

      const reloadedUser = await User.limit(1).joins({ mainComposition: 'compositionAssets' }).first()
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
        .joins(['compositions', { mainComposition: 'compositionAssets' }])
        .first()

      expect(reloadedUser!.mainComposition).toMatchObject(composition)
      expect(reloadedUser!.compositions).toMatchObject([composition, composition2])
      expect(reloadedUser!.mainComposition.compositionAssets).toMatchObject([compositionAsset])
    })
  })

  describe('through associations', () => {
    // it.only('joins a HasOne through HasMany association', async () => {
    //   const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    //   const composition = await Composition.create({ user_id: user.id })
    //   const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

    //   const reloadedUser = await User.limit(1).joins('mainCompositionAsset').first()
    //   expect(reloadedUser!.mainCompositionAsset).toEqual(compositionAsset)
    //   expect(reloadedUser!.compositions).toEqual([composition])
    //   expect(reloadedUser!.compositions[0].compositionAssets).toEqual([compositionAsset])
    // })

    //   it('joins a HasOne through BelongsTo association', async () => {
    //     const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    //     const composition = await Composition.create({ user_id: user.id })
    //     const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

    //     await compositionAsset.load('user')
    //     expect(compositionAsset.user!.isDreamInstance).toEqual(true)
    //     expect(compositionAsset.user!.attributes).toEqual(user.attributes)
    //   })

    it('joins a HasMany through HasMany association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

      const reloadedUser = await User.limit(1).joins('compositionAssets').first()
      expect(reloadedUser!.compositions).toMatchObject([composition])
      expect(reloadedUser!.compositions[0].compositionAssets).toEqual([compositionAsset])
      expect(reloadedUser!.compositionAssets).toEqual([compositionAsset])
    })

    //   describe('nested through associations', () => {
    //     it('joins a HasMany through another through association', async () => {
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
    //   })
  })
})
