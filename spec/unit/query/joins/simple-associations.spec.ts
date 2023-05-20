import User from '../../../../test-app/app/models/User'
import Composition from '../../../../test-app/app/models/Composition'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import CompositionAssetAudit from '../../../../test-app/app/models/CompositionAssetAudit'
import Pet from '../../../../test-app/app/models/Pet'
import { DateTime } from 'luxon'
import range from '../../../../src/helpers/range'

describe('Query#joins with simple associations', () => {
  it('joins a HasOne association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id, primary: true })

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

      const composition = await Composition.create({ user_id: user.id, primary: true })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

      const reloadedUsers = await User.limit(2).joins({ mainComposition: 'compositionAssets' }).all()

      expect(reloadedUsers).toMatchDreamModels([user])
    })
  })

  context('when passed an array', () => {
    it('loads specified associations', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id, primary: true })
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
      const composition = await Composition.create({ user_id: user.id, primary: true })

      const reloadedUsers = await User.limit(2)
        .joins('mainComposition')
        .where({ mainComposition: { id: composition.id } })
        .all()
      expect(reloadedUsers).toMatchDreamModels([user])

      const noResults = await User.limit(2)
        .joins('mainComposition')
        .where({ mainComposition: { id: parseInt(composition.id!.toString()) + 1 } })
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
        .where({ compositions: { id: parseInt(composition.id!.toString()) + 1 } })
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
        .where({ user: { id: parseInt(user.id!.toString()) + 1 } })
        .all()
      expect(noResults).toMatchDreamModels([])
    })

    context('when the where clause attribute exists on both models', () => {
      it('namespaces the attribute in the BelongsTo direction', async () => {
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ user })

        const reloadedComposition = await Composition.limit(2)
          .joins('user')
          .where({ created_at: range(DateTime.now().minus({ day: 1 })) })
          .first()
        expect(reloadedComposition).toMatchDreamModel(composition)

        const noResults = await Composition.limit(2)
          .joins('user')
          .where({ created_at: range(DateTime.now().plus({ day: 1 })) })
          .first()
        expect(noResults).toBeNull()
      })

      it('namespaces the attribute in the HasMany direction', async () => {
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        await Composition.create({ user })

        const reloadedUser = await User.limit(2)
          .joins('compositions')
          .where({ created_at: range(DateTime.now().minus({ day: 1 })) })
          .first()
        expect(reloadedUser).toMatchDreamModel(user)

        const noResults = await User.limit(2)
          .joins('compositions')
          .where({ created_at: range(DateTime.now().plus({ day: 1 })) })
          .first()
        expect(noResults).toBeNull()
      })
    })

    context('when passed an object', () => {
      it('loads specified associations', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })

        const composition = await Composition.create({ user_id: user.id, primary: true })
        const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

        const reloadedUsers = await User.limit(2)
          .joins({ mainComposition: 'compositionAssets' })
          .where({ mainComposition: { compositionAssets: { id: compositionAsset.id } } })
          .all()
        expect(reloadedUsers).toMatchDreamModels([user])

        const noResults = await User.limit(2)
          .joins({ mainComposition: 'compositionAssets' })
          .where({
            mainComposition: { compositionAssets: { id: parseInt(compositionAsset.id!.toString()) + 1 } },
          })
          .all()
        expect(noResults).toMatchDreamModels([])
      })
    })

    context('when passed an array', () => {
      it('loads specified associations', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ user_id: user.id, primary: true })
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
              compositions: { id: parseInt(composition.id!.toString()) + 1 },
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
              mainComposition: { compositionAssets: { id: parseInt(compositionAsset.id!.toString()) + 1 } },
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
      expect(reloadedComposition).toMatchDreamModel(composition)
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

  context('when the model and its association have a default scope with the same attribute name', () => {
    it('namespaces the scope', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Pet.create({ user })
      const reloadedUser = await User.where({ email: user.email }).joins('pets').first()
      // prior to fixing, this line would throw:
      //   error: column reference "deleted_at" is ambiguous
      expect(reloadedUser).toMatchDreamModel(user)
    })

    it('takes the nested scope into account', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Pet.create({ user, name: 'Snoopy', deleted_at: DateTime.now() })
      const reloadedUser = await User.where({ email: user.email })
        .joins('pets')
        .where({ pets: { name: 'Snoopy' } })
        .first()
      expect(reloadedUser).toBeNull()
    })
  })
})
