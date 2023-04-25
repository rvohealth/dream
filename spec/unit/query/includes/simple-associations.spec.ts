import User from '../../../../test-app/app/models/user'
import Composition from '../../../../test-app/app/models/composition'
import CompositionAsset from '../../../../test-app/app/models/composition-asset'
import CompositionAssetAudit from '../../../../test-app/app/models/composition-asset-audit'

describe('Query#includes with simple associations', () => {
  it('loads a HasOne association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id, primary: true })

    const reloadedUser = await User.limit(1).includes('mainComposition').first()
    expect(reloadedUser!.mainComposition).toMatchDreamModel(composition)
  })

  it('loads a HasMany association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition1 = await Composition.create({ user_id: user.id })
    const composition2 = await Composition.create({ user_id: user.id })

    const reloadedUser = await User.limit(1).includes('compositions').first()
    expect(reloadedUser!.compositions[0]).toMatchDreamModel(composition1)
    expect(reloadedUser!.compositions[1]).toMatchDreamModel(composition2)
  })

  it('loads a BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await Composition.create({ user_id: user.id })
    const reloadedComposition = await Composition.limit(1).includes('user').first()
    expect(reloadedComposition!.user).toMatchDreamModel(user)
  })

  it('can handle object notation', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

    const reloaded = await User.limit(3).includes({ compositions: 'compositionAssets' }).first()
    expect(reloaded!.compositions).toMatchDreamModels([composition])
    expect(reloaded!.compositions[0].compositionAssets).toMatchDreamModels([compositionAsset])
  })

  it('can handle array notation', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id, primary: true })
    const composition2 = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

    const reloadedUser = await User.limit(1)
      .includes(['compositions', { mainComposition: ['compositionAssets'] }])
      .first()

    expect(reloadedUser!.mainComposition).toMatchDreamModel(composition)
    expect(reloadedUser!.compositions).toMatchDreamModels([composition, composition2])
    expect(reloadedUser!.mainComposition.compositionAssets).toMatchDreamModels([compositionAsset])
  })

  it('can sideload multiple associations at once', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
    const compositionAssetAudit = await CompositionAssetAudit.create({
      composition_asset_id: compositionAsset.id,
    })

    const reloaded = await CompositionAssetAudit.limit(3).includes('composition', 'user').first()
    expect(reloaded!.composition).toMatchDreamModel(composition)
    expect(reloaded!.user).toMatchDreamModel(user)
  })

  context('with matching where-clause-on-the-association', () => {
    it('loads the associated object', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      await CompositionAsset.create({ composition_id: composition.id })
      const compositionAsset = await CompositionAsset.create({
        composition_id: composition.id,
        primary: true,
      })

      const reloadedComposition = await Composition.limit(1).includes('mainCompositionAsset').first()
      expect(reloadedComposition!.mainCompositionAsset).toMatchDreamModel(compositionAsset)
    })
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

      const reloadedComposition = await Composition.limit(1).includes('mainCompositionAsset').first()
      expect(reloadedComposition!.mainCompositionAsset).toBeUndefined()
    })
  })
})
