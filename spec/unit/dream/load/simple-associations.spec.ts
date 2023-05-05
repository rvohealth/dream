import User from '../../../../test-app/app/models/user'
import Composition from '../../../../test-app/app/models/composition'
import CompositionAsset from '../../../../test-app/app/models/composition-asset'
import CompositionAssetAudit from '../../../../test-app/app/models/composition-asset-audit'
import IncompatibleForeignKeyTypeExample from '../../../../test-app/app/models/incompatible-foreign-key-type-example'
import ForeignKeyOnAssociationDoesNotMatchPrimaryKeyOnBase from '../../../../src/exceptions/foreign-key-on-association-does-not-match-primary-key-on-base'

describe('Dream#load with simple associations', () => {
  it('loads a HasOne association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id, primary: true })

    await user.load('mainComposition')
    expect(user.mainComposition).toMatchDreamModel(composition)
  })

  it('loads a HasMany association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition1 = await Composition.create({ user_id: user.id })
    const composition2 = await Composition.create({ user_id: user.id })

    await user.load('compositions')
    expect(user.compositions[0]).toMatchDreamModel(composition1)
    expect(user.compositions[1]).toMatchDreamModel(composition2)
  })

  it('loads a BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    await composition.load('user')
    expect(composition.user).toMatchDreamModel(user)
  })

  it('can handle object notation', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

    await user.load({ compositions: 'compositionAssets' })
    expect(user.compositions).toMatchDreamModels([composition])
    expect(user.compositions[0].compositionAssets).toMatchDreamModels([compositionAsset])
  })

  it('can handle array notation', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id, primary: true })
    const composition2 = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

    await user.load(['compositions', { mainComposition: ['compositionAssets'] }])

    expect(user.mainComposition).toMatchDreamModel(composition)
    expect(user.compositions).toMatchDreamModels([composition, composition2])
    expect(user.mainComposition.compositionAssets).toMatchDreamModels([compositionAsset])
  })

  it('can sideload multiple associations at once', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
    const compositionAssetAudit = await CompositionAssetAudit.create({
      composition_asset_id: compositionAsset.id,
    })

    await compositionAssetAudit.load('composition', 'user')
    expect(compositionAssetAudit.composition).toMatchDreamModel(composition)
    expect(compositionAssetAudit.user).toMatchDreamModel(user)
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

      await composition.load('mainCompositionAsset')
      expect(composition.mainCompositionAsset).toMatchDreamModel(compositionAsset)
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

      await composition.load('mainCompositionAsset')
      expect(composition.mainCompositionAsset).toBeUndefined()
    })
  })

  context('when an association has a mismatched type on the foreign key', () => {
    it('throws an exception alerting the user to the mismatched types', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await IncompatibleForeignKeyTypeExample.create({ user })

      let error: Error | null = null
      try {
        await user.load('incompatibleForeignKeyTypeExamples')
      } catch (err: any) {
        error = err
      }
      expect(error!.constructor).toEqual(ForeignKeyOnAssociationDoesNotMatchPrimaryKeyOnBase)
    })
  })
})
