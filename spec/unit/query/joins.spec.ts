import User from '../../../test-app/app/models/user'
import Composition from '../../../test-app/app/models/composition'
import CompositionAsset from '../../../test-app/app/models/composition-asset'
import CompositionAssetAudit from '../../../test-app/app/models/composition-asset-audit'

describe('Query#joins', () => {
  it('joins a HasOne association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })

    const reloadedUser = await User.limit(2)
      .joins('mainComposition')
      .where({ mainComposition: { id: composition.id } })
      .all()
    expect(reloadedUser!).toMatchObject([user])
  })

  it('joins a HasMany association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })

    const reloadedUser = await User.limit(2)
      .joins('compositions')
      .where({ compositions: { id: composition.id } })
      .all()
    expect(reloadedUser!).toMatchObject([user])
  })

  it('joins a BelongsTo association', async () => {
    const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await Composition.create({ user_id: otherUser.id })

    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })

    const reloadedComposition = await Composition.limit(2)
      .joins('user')
      .where({ user: { id: user.id } })
      .all()
    expect(reloadedComposition).toMatchObject([composition])
  })

  context('when passed an object', () => {
    it('loads specified associations', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })

      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

      const reloadedUsers = await User.limit(2)
        .joins({ mainComposition: 'compositionAssets' })
        .where({ mainComposition: { compositionAssets: { id: compositionAsset.id } } })
        .all()

      expect(reloadedUsers).toMatchObject([user])
    })
  })

  context('when passed an array', () => {
    it('loads specified associations', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const composition2 = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

      const reloadedUsers = await User.limit(2)
        .joins(['compositions', { mainComposition: 'compositionAssets' }])
        .where([
          {
            compositions: { id: composition.id },
          },
          {
            mainComposition: { compositionAssets: { id: compositionAsset.id } },
          },
        ])
        .all()
      expect(reloadedUsers).toMatchObject([user])
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
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

      const reloadedUsers = await User.limit(2)
        .joins('compositionAssets')
        .where({ compositionAssets: { id: compositionAsset.id } })
        .all()
      expect(reloadedUsers).toMatchObject([user])
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
