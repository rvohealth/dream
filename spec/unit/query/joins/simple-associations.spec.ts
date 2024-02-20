import User from '../../../../test-app/app/models/User'
import Composition from '../../../../test-app/app/models/Composition'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import Pet from '../../../../test-app/app/models/Pet'
import { DateTime } from 'luxon'
import range from '../../../../src/helpers/range'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar'
import Balloon from '../../../../test-app/app/models/Balloon'
import ops from '../../../../src/ops'
import OpsStatement from '../../../../src/ops/ops-statement'
import LocalizedText from '../../../../test-app/app/models/LocalizedText'

describe('Query#joins with simple associations', () => {
  it('joins a HasOne association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ userId: user.id, primary: true })

    const reloadedUsers = await User.query().joins('mainComposition').all()
    expect(reloadedUsers).toMatchDreamModels([user])
  })

  it('joins a HasMany association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ userId: user.id })

    const reloadedUsers = await User.query().joins('compositions').all()
    expect(reloadedUsers).toMatchDreamModels([user])
  })

  context('when passed an object', () => {
    it('loads specified associations', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })

      const composition = await Composition.create({ userId: user.id, primary: true })
      const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })

      const reloadedUsers = await User.query().joins('mainComposition', 'compositionAssets').all()

      expect(reloadedUsers).toMatchDreamModels([user])
    })
  })

  context('when passed an array', () => {
    it('loads specified associations', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ userId: user.id, primary: true })
      await CompositionAsset.create({ compositionId: composition.id })

      const reloadedUsers = await User.query()
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
      const composition = await Composition.create({ userId: user.id, primary: true })

      const reloadedUsers = await User.query().joins('mainComposition', { id: composition.id }).all()
      expect(reloadedUsers).toMatchDreamModels([user])

      const noResults = await User.query()
        .joins('mainComposition', { id: parseInt(composition.id!.toString()) + 1 })
        .all()
      expect(noResults).toEqual([])
    })

    context('with "passthrough"', () => {
      it('applies the passthrough when joining the associations', async () => {
        const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition1 = await Composition.create({ user: user1 })
        await LocalizedText.create({ localizable: composition1, locale: 'en-US' })

        const user2 = await User.create({ email: 'howyya@doin', password: 'howyadoin' })
        const composition2 = await Composition.create({ user: user2 })
        await LocalizedText.create({ localizable: composition2, locale: 'es-ES' })

        const reloaded = await User.passthrough({ locale: 'es-ES' })
          .joins('compositions', 'currentLocalizedText')
          .all()
        expect(reloaded).toMatchDreamModels([user2])
      })
    })

    context('joining on similar text', () => {
      it('excludes records that are not similar to text', async () => {
        const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'Hello World' })
        const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'Hallo' })
        const user3 = await User.create({ email: 'how@frewd', password: 'howyadoin', name: 'George' })
        const balloon1 = await Mylar.create({ user: user1 })
        const balloon2 = await Mylar.create({ user: user2 })
        const balloon3 = await Mylar.create({ user: user3 })

        const balloons = await Balloon.joins('user', { name: ops.similarity('hello') }).all()
        expect(balloons).toMatchDreamModels([balloon1, balloon2])
      })
    })

    context('with an ops object', () => {
      it('changing the ops object after joining does not affect the join', async () => {
        const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'Hello World' })
        const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'Hallo' })
        const balloon1 = await Mylar.create({ user: user1 })
        const balloon2 = await Mylar.create({ user: user2 })

        const whereClause: Record<string, OpsStatement<any, any>> = { id: ops.equal(user1.id) }
        const query = Balloon.joins('user', whereClause)
        whereClause.id.value = user2.id
        const balloons = await query.all()
        expect(balloons).toMatchDreamModels([balloon1])
      })
    })

    it('joins a HasMany association', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ userId: user.id })

      const reloadedUsers = await User.query().joins('compositions', { id: composition.id }).all()
      expect(reloadedUsers).toMatchDreamModels([user])

      const noResults = await User.query()
        .joins('compositions', { id: parseInt(composition.id!.toString()) + 1 })
        .all()
      expect(noResults).toEqual([])
    })

    it('joins a BelongsTo association', async () => {
      const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ userId: otherUser.id })

      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ userId: user.id })

      const reloadedComposition = await Composition.query().joins('user', { id: user.id }).all()
      expect(reloadedComposition).toMatchDreamModels([composition])

      const noResults = await Composition.query()
        .joins('user', { id: parseInt(user.id!.toString()) + 1 })
        .all()
      expect(noResults).toEqual([])
    })

    context('when the where clause attribute exists on both models', () => {
      it('namespaces the attribute in the BelongsTo direction', async () => {
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ user })

        const reloadedComposition = await Composition.query()
          .joins('user', { createdAt: range(DateTime.now().minus({ day: 1 })) })
          .first()
        expect(reloadedComposition).toMatchDreamModel(composition)

        const noResults = await Composition.query()
          .joins('user', { createdAt: range(DateTime.now().plus({ day: 1 })) })
          .first()
        expect(noResults).toBeNull()
      })

      it('namespaces the attribute in the HasMany direction', async () => {
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        await Composition.create({ user })

        const reloadedUser = await User.query()
          .joins('compositions', { createdAt: range(DateTime.now().minus({ day: 1 })) })
          .first()
        expect(reloadedUser).toMatchDreamModel(user)

        const noResults = await User.query()
          .joins('compositions', { createdAt: range(DateTime.now().plus({ day: 1 })) })
          .first()
        expect(noResults).toBeNull()
      })
    })

    context('nested', () => {
      it('loads specified associations', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })

        const composition = await Composition.create({ userId: user.id, primary: true })
        const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })

        const reloadedUsers = await User.query()
          .joins('mainComposition', 'compositionAssets', { id: compositionAsset.id })
          .all()
        expect(reloadedUsers).toMatchDreamModels([user])

        const noResults = await User.query()
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
        const composition = await Composition.create({ userId: user.id, primary: true })
        const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })

        const reloadedUsers = await User.query()
          .joins('compositions', { id: composition.id })
          .joins('mainComposition', 'compositionAssets', { id: compositionAsset.id })
          .all()
        expect(reloadedUsers).toMatchDreamModels([user])

        const noResults1 = await User.query()
          .joins('compositions', { id: parseInt(composition.id!.toString()) + 1 })
          .joins('mainComposition', 'compositionAssets', { id: compositionAsset.id })
          .all()
        expect(noResults1).toEqual([])

        const noResults2 = await User.query()
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
          createdAt: DateTime.now().minus({ day: 1 }),
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
          createdAt: DateTime.now().minus({ year: 1 }),
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
          createdAt: DateTime.now().minus({ day: 1 }),
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
          createdAt: DateTime.now().minus({ year: 1 }),
        })

        const reloadedUser = await User.joins('notRecentCompositions').first()
        expect(reloadedUser).toMatchDreamModel(user)
      })
    })

    context('with order-clause-on-the-association', () => {
      it('loads the associated object', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Composition.create({
          user,
        })

        const reloadedUser = await User.joins('sortedCompositions').first()
        expect(reloadedUser).toMatchDreamModel(user)
      })
    })

    context('pointing to an STI model', () => {
      it('loads the association', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Mylar.create({ user, color: 'blue' })

        const reloadedUser = await User.query().joins('balloons').first()
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

    context('with order-clause-on-the-association', () => {
      it('loads the associated object', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Composition.create({
          user,
        })

        const reloadedUser = await User.joins('lastComposition').first()
        expect(reloadedUser).toMatchDreamModel(user)
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

    it('applies the default scope on the associated class', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      await Pet.create({ user: user1, name: 'Snoopy', deletedAt: DateTime.now() })
      await Pet.create({ user: user2, name: 'Woodstock' })

      const users = await User.joins('pets').all()
      expect(users).toMatchDreamModels([user2])
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
        createdAt: begin,
      })
      user1 = await User.create({
        email: 'fred@frezd',
        password: 'howyadoin',
        createdAt: begin.plus({ day: 1 }),
      })

      pet0 = await Pet.create({ user: user0 })
      pet1 = await Pet.create({ user: user1 })
    })

    it('is able to apply date ranges to where clause', async () => {
      const pets = await Pet.joins('user', { createdAt: range(begin.plus({ hour: 1 })) }).all()
      expect(pets).toMatchDreamModels([pet1])
    })
  })

  context('join + where statement more than one level deep', () => {
    it('does not leak between clones', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const pet = await user.createAssociation('pets', { name: 'aster' })
      const collar = await pet.createAssociation('collars', { tagName: 'Aster', pet })
      const baseScope = User.joins('pets')

      const results = await baseScope
        .joins('pets', 'collars')
        .whereAny([
          {
            id: baseScope.joins('pets', 'collars', { tagName: 'Aster' }).nestedSelect('pets.userId'),
          },
          {
            id: baseScope.joins('pets', 'collars', { tagName: 'Snoopy' }).nestedSelect('pets.userId'),
          },
        ])
        .limit(1)
        .all()

      expect(results).toMatchDreamModels([user])
    })
  })

  // this is skipped, since it is only here to ensure that types are working
  // from args a-g, which does not actually need to be run, since if this is
  // broken, tests will fail to compile due to type errors
  it.skip('permits types a-g', async () => {
    Composition.query().joins('user', 'balloons', 'user', 'balloons', 'user', 'balloons')
  })
})
