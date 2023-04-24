import User from '../../../../test-app/app/models/user'
import Composition from '../../../../test-app/app/models/composition'
import CompositionAsset from '../../../../test-app/app/models/composition-asset'
import CompositionAssetAudit from '../../../../test-app/app/models/composition-asset-audit'

describe('Query#joins through with simple associations', () => {
  it('joins a HasOne through HasOne association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({
      composition_id: composition.id,
      primary: true,
    })

    const reloadedUsers = await User.limit(2).joins('mainCompositionAsset').all()
    expect(reloadedUsers).toMatchDreamModels([user])
  })

  it('joins a HasMany through HasMany association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    await CompositionAsset.create({ composition_id: composition.id })

    const reloadedUsers = await User.limit(2).joins('compositionAssets').all()
    expect(reloadedUsers).toMatchDreamModels([user])
  })

  context('nested through associations', () => {
    it('joins a HasMany through another through association', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
      const compositionAssetAudit = await CompositionAssetAudit.create({
        composition_asset_id: compositionAsset.id,
      })

      const reloadedUsers = await User.limit(2).joins('compositionAssetAudits').all()
      expect(reloadedUsers).toMatchDreamModels([user])
    })
  })

  describe('with where clause', () => {
    it('joins a HasOne through HasOne association', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({
        composition_id: composition.id,
        primary: true,
      })

      const reloadedUsers = await User.limit(2)
        .joins('mainCompositionAsset')
        .where({ mainCompositionAsset: { id: compositionAsset.id } })
        .all()
      expect(reloadedUsers).toMatchDreamModels([user])

      const noResults = await User.limit(2)
        .joins('mainCompositionAsset')
        .where({ mainCompositionAsset: { id: compositionAsset.id + 1 } })
        .all()
      expect(noResults).toMatchDreamModels([])
    })

    it('joins a HasOne through BelongsTo association', async () => {
      const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const otherComposition = await Composition.create({ user_id: otherUser.id })
      await CompositionAsset.create({ composition_id: otherComposition.id })

      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

      const reloadedCompositionAssets = await CompositionAsset.limit(2)
        .joins('user')
        .where({ user: { id: user.id } })
        .all()
      expect(reloadedCompositionAssets).toMatchDreamModels([compositionAsset])

      const noResults = await CompositionAsset.limit(2)
        .joins('user')
        .where({ user: { id: user.id + 1 } })
        .all()
      expect(noResults).toMatchDreamModels([])
    })

    it('joins a HasMany through HasMany association', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

      const reloadedUsers = await User.limit(2)
        .joins('compositionAssets')
        .where({ compositionAssets: { id: compositionAsset.id } })
        .all()
      expect(reloadedUsers).toMatchDreamModels([user])

      const noResults = await User.limit(2)
        .joins('compositionAssets')
        .where({ compositionAssets: { id: compositionAsset.id + 1 } })
        .all()
      expect(noResults).toMatchDreamModels([])
    })

    context('nested through associations', () => {
      it('joins a HasMany through another through association', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ user_id: user.id })
        const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
        const compositionAssetAudit = await CompositionAssetAudit.create({
          composition_asset_id: compositionAsset.id,
        })

        const reloadedUsers = await User.limit(2)
          .joins('compositionAssetAudits')
          .where({ compositionAssetAudits: { id: compositionAssetAudit.id } })
          .all()
        expect(reloadedUsers).toMatchDreamModels([user])

        const noResults = await User.limit(2)
          .joins('compositionAssetAudits')
          .where({ compositionAssetAudits: { id: compositionAssetAudit.id + 1 } })
          .all()
        expect(noResults).toMatchDreamModels([])
      })
    })
  })
})
