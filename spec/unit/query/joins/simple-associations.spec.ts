import User from '../../../../test-app/app/models/User'
import Composition from '../../../../test-app/app/models/Composition'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import Pet from '../../../../test-app/app/models/Pet'
import { DateTime } from 'luxon'
import range from '../../../../src/helpers/range'
import Query from '../../../../src/dream/query'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar'

describe('Query#joins with simple associations', () => {
  it('joins a HasOne association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id, primary: true })

    const reloadedUsers = await new Query(User).joins('mainComposition').all()
    expect(reloadedUsers).toMatchDreamModels([user])
  })

  it('joins a HasMany association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })

    const reloadedUsers = await new Query(User).joins('compositions').all()
    expect(reloadedUsers).toMatchDreamModels([user])
  })

  context('when passed an object', () => {
    it('loads specified associations', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })

      const composition = await Composition.create({ user_id: user.id, primary: true })
      const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

      const reloadedUsers = await new Query(User).joins('mainComposition', 'compositionAssets').all()

      expect(reloadedUsers).toMatchDreamModels([user])
    })
  })

  context('when passed an array', () => {
    it('loads specified associations', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id, primary: true })
      await CompositionAsset.create({ composition_id: composition.id })

      const reloadedUsers = await new Query(User)
        .joins('compositions')
        .joins('mainComposition', 'compositionAssets')
        .all()
      expect(reloadedUsers).toMatchDreamModels([user])
    })
  })

  context('with a where clause', () => {
    it('joins a HasOne association', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id, primary: true })

      const reloadedUsers = await new Query(User).joins('mainComposition', { id: composition.id }).all()
      expect(reloadedUsers).toMatchDreamModels([user])

      const noResults = await new Query(User)
        .joins('mainComposition', { id: parseInt(composition.id!.toString()) + 1 })
        .all()
      expect(noResults).toEqual([])
    })

    it('joins a HasMany association', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })

      const reloadedUsers = await new Query(User).joins('compositions', { id: composition.id }).all()
      expect(reloadedUsers).toMatchDreamModels([user])

      const noResults = await new Query(User)
        .joins('compositions', { id: parseInt(composition.id!.toString()) + 1 })
        .all()
      expect(noResults).toEqual([])
    })

    it('joins a BelongsTo association', async () => {
      const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ user_id: otherUser.id })

      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })

      const reloadedComposition = await new Query(Composition).joins('user', { id: user.id }).all()
      expect(reloadedComposition).toMatchDreamModels([composition])

      const noResults = await new Query(Composition)
        .joins('user', { id: parseInt(user.id!.toString()) + 1 })
        .all()
      expect(noResults).toEqual([])
    })

    context('when the where clause attribute exists on both models', () => {
      it('namespaces the attribute in the BelongsTo direction', async () => {
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ user })

        const reloadedComposition = await new Query(Composition)
          .joins('user', { created_at: range(DateTime.now().minus({ day: 1 })) })
          .first()
        expect(reloadedComposition).toMatchDreamModel(composition)

        const noResults = await new Query(Composition)
          .joins('user', { created_at: range(DateTime.now().plus({ day: 1 })) })
          .first()
        expect(noResults).toBeNull()
      })

      it('namespaces the attribute in the HasMany direction', async () => {
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        await Composition.create({ user })

        const reloadedUser = await new Query(User)
          .joins('compositions', { created_at: range(DateTime.now().minus({ day: 1 })) })
          .first()
        expect(reloadedUser).toMatchDreamModel(user)

        const noResults = await new Query(User)
          .joins('compositions', { created_at: range(DateTime.now().plus({ day: 1 })) })
          .first()
        expect(noResults).toBeNull()
      })
    })

    context('nested', () => {
      it('loads specified associations', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })

        const composition = await Composition.create({ user_id: user.id, primary: true })
        const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

        const reloadedUsers = await new Query(User)
          .joins('mainComposition', 'compositionAssets', { id: compositionAsset.id })
          .all()
        expect(reloadedUsers).toMatchDreamModels([user])

        const noResults = await new Query(User)
          .joins('mainComposition', 'compositionAssets', {
            id: parseInt(compositionAsset.id!.toString()) + 1,
          })
          .all()
        expect(noResults).toEqual([])
      })
    })

    context('sibling joins', () => {
      it('loads specified associations', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ user_id: user.id, primary: true })
        const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

        const reloadedUsers = await new Query(User)
          .joins('compositions', { id: composition.id })
          .joins('mainComposition', 'compositionAssets', { id: compositionAsset.id })
          .all()
        expect(reloadedUsers).toMatchDreamModels([user])

        const noResults1 = await new Query(User)
          .joins('compositions', { id: parseInt(composition.id!.toString()) + 1 })
          .joins('mainComposition', 'compositionAssets', { id: compositionAsset.id })
          .all()
        expect(noResults1).toEqual([])

        const noResults2 = await new Query(User)
          .joins('compositions', { id: composition.id })
          .joins('mainComposition', 'compositionAssets', {
            id: parseInt(compositionAsset.id!.toString()) + 1,
          })
          .all()
        expect(noResults2).toEqual([])
      })
    })
  })

  context('HasMany', () => {
    context('with matching where-clause-on-the-association', () => {
      it('loads the associated object', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Composition.create({
          user,
          created_at: DateTime.now().minus({ day: 1 }),
        })

        const reloadedUser = await User.joins('recentCompositions').first()
        expect(reloadedUser).toMatchDreamModel(user)
      })
    })

    context('with NON-matching where-clause-on-the-association', () => {
      it('does not load the object', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Composition.create({
          user,
          created_at: DateTime.now().minus({ year: 1 }),
        })

        const reloadedUser = await User.joins('recentCompositions').first()
        expect(reloadedUser).toBeNull()
      })
    })

    context('with matching whereNot-clause-on-the-association', () => {
      it('does not load the object', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Composition.create({
          user,
          created_at: DateTime.now().minus({ day: 1 }),
        })

        const reloadedUser = await User.joins('notRecentCompositions').first()
        expect(reloadedUser).toBeNull()
      })
    })

    context('with NON-matching whereNot-clause-on-the-association', () => {
      it('loads the associated object', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Composition.create({
          user,
          created_at: DateTime.now().minus({ year: 1 }),
        })

        const reloadedUser = await User.joins('notRecentCompositions').first()
        expect(reloadedUser).toMatchDreamModel(user)
      })
    })

    context('pointing to an STI model', () => {
      it('loads the association', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Mylar.create({ user, color: 'blue' })

        const reloadedUser = await new Query(User).joins('balloons').first()
        expect(reloadedUser).toMatchDreamModel(user)
      })
    })
  })

  context('HasOne', () => {
    context('with matching where-clause-on-the-association', () => {
      it('loads the associated object', async () => {
        const pet = await Pet.create()
        await pet.createAssociation('collars', {
          lost: false,
        })

        const reloaded = await Pet.joins('currentCollar').first()
        expect(reloaded).toMatchDreamModel(pet)
      })
    })

    context('with NON-matching where-clause-on-the-association', () => {
      it('does not load the object', async () => {
        const pet = await Pet.create()
        await pet.createAssociation('collars', {
          lost: true,
        })

        const reloaded = await Pet.joins('currentCollar').first()
        expect(reloaded).toBeNull()
      })
    })

    context('with matching whereNot-clause-on-the-association', () => {
      it('does not load the associated object', async () => {
        const pet = await Pet.create()
        await pet.createAssociation('collars', {
          lost: true,
        })

        const reloaded = await Pet.joins('notLostCollar').first()
        expect(reloaded).toBeNull()
      })
    })

    context('with NON-matching whereNot-clause-on-the-association', () => {
      it('loads the associated object', async () => {
        const pet = await Pet.create()
        await pet.createAssociation('collars', {
          lost: false,
        })

        const reloaded = await Pet.joins('notLostCollar').first()
        expect(reloaded).toMatchDreamModel(pet)
      })
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
      const reloadedUser = await User.where({ email: user.email }).joins('pets', { name: 'Snoopy' }).first()
      const notFoundUser = await User.where({ email: user.email }).joins('pets', { name: 'Znoopy' }).first()

      expect(reloadedUser).toMatchDreamModel(user)
      expect(notFoundUser).toBeNull()
    })
  })

  context('date range condition', () => {
    const begin = DateTime.now()

    let user0: User
    let user1: User
    let pet0: Pet
    let pet1: Pet

    beforeEach(async () => {
      user0 = await User.create({
        email: 'fred@frewd',
        password: 'howyadoin',
        created_at: begin,
      })
      user1 = await User.create({
        email: 'fred@frezd',
        password: 'howyadoin',
        created_at: begin.plus({ day: 1 }),
      })

      pet0 = await Pet.create({ user: user0 })
      pet1 = await Pet.create({ user: user1 })
    })

    it('is able to apply date ranges to where clause', async () => {
      const pets = await Pet.joins('user', { created_at: range(begin.plus({ hour: 1 })) }).all()

      expect(pets).toMatchDreamModels([pet1])
    })
  })
})
