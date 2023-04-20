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
      expect(reloadedUser!.compositions).toMatchObject([composition])
      expect(reloadedUser!.compositions[0].compositionAssets).toEqual([compositionAsset])
      expect(reloadedUser!.compositionAssets).toEqual([compositionAsset])
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
        expect(user.compositionAssetAudits!).toMatchObject([compositionAssetAudit])
      })
    })
  })
})
