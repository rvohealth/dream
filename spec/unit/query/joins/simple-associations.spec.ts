import User from '../../../../test-app/app/models/user'
import Composition from '../../../../test-app/app/models/composition'
import CompositionAsset from '../../../../test-app/app/models/composition-asset'
import CompositionAssetAudit from '../../../../test-app/app/models/composition-asset-audit'

describe('Query#joins with simple associations', () => {
  it('joins a HasOne association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })

    const reloadedUsers = await User.limit(2).joins('mainComposition').all()
    expect(reloadedUsers).toMatchDreamModels([user])
  })

  it('joins a HasMany association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })

    const reloadedUsers = await User.limit(2).joins('compositions').all()
    expect(reloadedUsers).toMatchDreamModels([user])
  })

  context('when passed an object', () => {
    it('loads specified associations', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })

      const composition = await Composition.create({ user_id: user.id })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

      const reloadedUsers = await User.limit(2).joins({ mainComposition: 'compositionAssets' }).all()

      expect(reloadedUsers).toMatchDreamModels([user])
    })
  })

  context('when passed an array', () => {
    it('loads specified associations', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      await CompositionAsset.create({ composition_id: composition.id })

      const reloadedUsers = await User.limit(2)
        .joins(['compositions', { mainComposition: 'compositionAssets' }])
        .all()
      expect(reloadedUsers).toMatchDreamModels([user])
    })
  })

  context('with a where clause', () => {
    it('joins a HasOne association', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })

      const reloadedUsers = await User.limit(2)
        .joins('mainComposition')
        .where({ mainComposition: { id: composition.id } })
        .all()
      expect(reloadedUsers).toMatchDreamModels([user])

      const noResults = await User.limit(2)
        .joins('mainComposition')
        .where({ mainComposition: { id: composition.id + 1 } })
        .all()
      expect(noResults).toMatchDreamModels([])
    })

    it('joins a HasMany association', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })

      const reloadedUsers = await User.limit(2)
        .joins('compositions')
        .where({ compositions: { id: composition.id } })
        .all()
      expect(reloadedUsers).toMatchDreamModels([user])

      const noResults = await User.limit(2)
        .joins('compositions')
        .where({ compositions: { id: composition.id + 1 } })
        .all()
      expect(noResults).toMatchDreamModels([])
    })

    it('joins a BelongsTo association', async () => {
      const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ user_id: otherUser.id })

      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })

      const reloadedComposition = await Composition.limit(2)
        .joins('user')
        .where({ user: { id: user.id } })
        .all()
      expect(reloadedComposition).toMatchDreamModels([composition])

      const noResults = await Composition.limit(2)
        .joins('user')
        .where({ user: { id: user.id + 1 } })
        .all()
      expect(noResults).toMatchDreamModels([])
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
        expect(reloadedUsers).toMatchDreamModels([user])

        const noResults = await User.limit(2)
          .joins({ mainComposition: 'compositionAssets' })
          .where({ mainComposition: { compositionAssets: { id: compositionAsset.id + 1 } } })
          .all()
        expect(noResults).toMatchDreamModels([])
      })
    })

    context('when passed an array', () => {
      it('loads specified associations', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ user_id: user.id })
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
        expect(reloadedUsers).toMatchDreamModels([user])

        const noResults1 = await User.limit(2)
          .joins(['compositions', { mainComposition: 'compositionAssets' }])
          .where([
            {
              compositions: { id: composition.id + 1 },
            },
            {
              mainComposition: { compositionAssets: { id: compositionAsset.id } },
            },
          ])
          .all()
        expect(noResults1).toMatchDreamModels([])

        const noResults2 = await User.limit(2)
          .joins(['compositions', { mainComposition: 'compositionAssets' }])
          .where([
            {
              compositions: { id: composition.id },
            },
            {
              mainComposition: { compositionAssets: { id: compositionAsset.id + 1 } },
            },
          ])
          .all()
        expect(noResults2).toMatchDreamModels([])
      })
    })
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

      const reloadedComposition = await Composition.limit(1).joins('mainCompositionAsset').first()
      expect(reloadedComposition).toMatchObject(composition)
    })
  })

  context('with NON-matching where-clause-on-the-association', () => {
    it('does not load the object', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })
      await CompositionAsset.create({ composition_id: composition.id })
      const compositionAsset = await CompositionAsset.create({
        composition_id: composition.id,
        primary: false,
      })

      const reloadedComposition = await Composition.limit(1).joins('mainCompositionAsset').first()
      expect(reloadedComposition).toBeNull()
    })
  })
})
