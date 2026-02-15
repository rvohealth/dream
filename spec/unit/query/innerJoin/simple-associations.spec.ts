import MissingRequiredAssociationAndClause from '../../../../src/errors/associations/MissingRequiredAssociationAndClause.js'
import range from '../../../../src/helpers/range.js'
import ops from '../../../../src/ops/index.js'
import { CalendarDate, ClockTime } from '../../../../src/package-exports/index.js'
import { DateTime } from '../../../../src/utils/datetime/DateTime.js'
import Balloon from '../../../../test-app/app/models/Balloon.js'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import Collar from '../../../../test-app/app/models/Collar.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset.js'
import HeartRating from '../../../../test-app/app/models/ExtraRating/HeartRating.js'
import LocalizedText from '../../../../test-app/app/models/LocalizedText.js'
import ModelForDatabaseTypeSpec from '../../../../test-app/app/models/ModelForDatabaseTypeSpec.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import User from '../../../../test-app/app/models/User.js'

describe('Query#joins with simple associations', () => {
  it('joins a HasOne association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    await Composition.create({ userId: user.id, primary: true })

    const reloadedUsers = await User.query().innerJoin('mainComposition').all()
    expect(reloadedUsers).toMatchDreamModels([user])
  })

  it('joins a HasMany association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    await Composition.create({ userId: user.id })

    const reloadedUsers = await User.query().innerJoin('compositions').all()
    expect(reloadedUsers).toMatchDreamModels([user])
  })

  context('with an association provided as an argument to the and clause', () => {
    it('supports associations as clauses', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ user, content: 'hello' })
      const composition = await Composition.create({ user, content: 'goodbye' })
      await HeartRating.create({ extraRateable: composition, user })

      const composition2 = await Composition.create({ user, content: 'goodbye' })
      await HeartRating.create({ extraRateable: composition2, user })

      const reloaded = await User.query()
        .leftJoin('heartRatings', {
          and: { extraRateable: composition },
        })
        .firstOrFail()
      expect(reloaded).toMatchDreamModel(user)
    })
  })

  context('when passed an object', () => {
    it('loads specified associations', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })

      const composition = await Composition.create({ userId: user.id, primary: true })
      await CompositionAsset.create({ compositionId: composition.id })

      const reloadedUsers = await User.query().innerJoin('mainComposition', 'compositionAssets').all()

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
        .innerJoin('compositions')
        .innerJoin('mainComposition', 'compositionAssets')
        .all()
      expect(reloadedUsers).toMatchDreamModels([user])
    })
  })

  context('with an and-clause', () => {
    it('joins a HasOne association', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ userId: user.id, primary: true })

      const reloadedUsers = await User.query()
        .innerJoin('mainComposition', { and: { id: composition.id } })
        .all()
      expect(reloadedUsers).toMatchDreamModels([user])

      const noResults = await User.query()
        .innerJoin('mainComposition', { and: { id: (parseInt(composition.id.toString()) + 1).toString() } })
        .all()
      expect(noResults).toEqual([])
    })

    context('with an array as the and-clause value', () => {
      it('selects results that match items in the array', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ userId: user.id, primary: true })

        const reloadedUsers = await User.query()
          .innerJoin('mainComposition', { and: { id: [composition.id] } })
          .all()
        expect(reloadedUsers).toMatchDreamModels([user])

        const noResults = await User.query()
          .innerJoin('mainComposition', {
            and: {
              id: [
                (parseInt(composition.id.toString()) + 1).toString(),
                (parseInt(composition.id.toString()) + 2).toString(),
              ],
            },
          })
          .all()
        expect(noResults).toEqual([])
      })

      context('when the array is empty', () => {
        it('selects no results', async () => {
          await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
          await Composition.create({ userId: user.id, primary: true })

          const noResults = await User.query()
            .innerJoin('compositions', { and: { id: [] } })
            .all()
          expect(noResults).toEqual([])
        })

        context('negated', () => {
          it('selects no results', async () => {
            await User.create({ email: 'fred@frewd', password: 'howyadoin' })
            const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
            await Composition.create({ userId: user.id, primary: true })

            const reloadedUsers = await User.query()
              .innerJoin('compositions', { and: { id: ops.not.in([]) } })
              .all()
            expect(reloadedUsers).toMatchDreamModels([user])
          })
        })
      })
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
          .innerJoin('compositions', 'passthroughCurrentLocalizedText')
          .all()
        expect(reloaded).toMatchDreamModels([user2])
      })
    })

    context('with required and-clause', () => {
      it('replaces DreamConst.required with the supplied and-clause when joining the associations', async () => {
        const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition1 = await Composition.create({ user: user1 })
        await LocalizedText.create({ localizable: composition1, locale: 'en-US' })

        const user2 = await User.create({ email: 'howyya@doin', password: 'howyadoin' })
        const composition2 = await Composition.create({ user: user2 })
        await LocalizedText.create({ localizable: composition2, locale: 'es-ES' })

        const reloaded = await User.innerJoin('compositions', 'requiredCurrentLocalizedText', {
          and: {
            locale: 'es-ES',
          },
        }).all()
        expect(reloaded).toMatchDreamModels([user2])
      })

      context('when the required and-clause isn’t passed', () => {
        it('throws MissingRequiredAssociationWhereClause', async () => {
          await expect(User.innerJoin('compositions', 'requiredCurrentLocalizedText').all()).rejects.toThrow(
            MissingRequiredAssociationAndClause
          )
        })
      })
    })

    context('joining on similar text', () => {
      it('excludes records that are not similar to text', async () => {
        const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'Hello World' })
        const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'Hallo' })
        const user3 = await User.create({ email: 'how@frewd', password: 'howyadoin', name: 'George' })
        const balloon1 = await Mylar.create({ user: user1 })
        const balloon2 = await Mylar.create({ user: user2 })
        await Mylar.create({ user: user3 })

        const balloons = await Balloon.innerJoin('user', { and: { name: ops.similarity('hello') } }).all()
        expect(balloons).toMatchDreamModels([balloon1, balloon2])
      })
    })

    it('joins a HasMany association', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ userId: user.id })

      const reloadedUsers = await User.query()
        .innerJoin('compositions', { and: { id: composition.id } })
        .all()
      expect(reloadedUsers).toMatchDreamModels([user])

      const noResults = await User.query()
        .innerJoin('compositions', { and: { id: (parseInt(composition.id.toString()) + 1).toString() } })
        .all()
      expect(noResults).toEqual([])
    })

    it('joins a BelongsTo association', async () => {
      const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ userId: otherUser.id })

      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ userId: user.id })

      const reloadedComposition = await Composition.query()
        .innerJoin('user', { and: { id: user.id } })
        .all()
      expect(reloadedComposition).toMatchDreamModels([composition])

      const noResults = await Composition.query()
        .innerJoin('user', { and: { id: (parseInt(user.id.toString()) + 1).toString() } })
        .all()
      expect(noResults).toEqual([])
    })

    context('when the and-clause attribute exists on both models', () => {
      it('namespaces the attribute in the BelongsTo direction', async () => {
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ user })

        const reloadedComposition = await Composition.query()
          .innerJoin('user', { and: { createdAt: range(DateTime.now().minus({ day: 1 })) } })
          .first()
        expect(reloadedComposition).toMatchDreamModel(composition)

        const noResults = await Composition.query()
          .innerJoin('user', { and: { createdAt: range(DateTime.now().plus({ day: 1 })) } })
          .first()
        expect(noResults).toBeNull()
      })

      it('namespaces the attribute in the HasMany direction', async () => {
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        await Composition.create({ user })

        const reloadedUser = await User.query()
          .innerJoin('compositions', { and: { createdAt: range(DateTime.now().minus({ day: 1 })) } })
          .first()
        expect(reloadedUser).toMatchDreamModel(user)

        const noResults = await User.query()
          .innerJoin('compositions', { and: { createdAt: range(DateTime.now().plus({ day: 1 })) } })
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
          .innerJoin('mainComposition', 'compositionAssets', { and: { id: compositionAsset.id } })
          .all()
        expect(reloadedUsers).toMatchDreamModels([user])

        const noResults = await User.query()
          .innerJoin('mainComposition', 'compositionAssets', {
            and: { id: (parseInt(compositionAsset.id.toString()) + 1).toString() },
          })
          .all()
        expect(noResults).toEqual([])
      })

      context(
        'when the and clause is a DateTime column that does not exist on the Dream model that starts the query',
        () => {
          it('loads specified associations', async () => {
            const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
            const user2 = await User.create({ email: 'fred@fishman', password: 'howyadoin' })

            const pet1 = await Pet.create({ user: user1, name: 'Aster' })
            const pet2 = await Pet.create({ user: user2, name: 'Violet' })

            await ModelForDatabaseTypeSpec.create({
              pet: pet1,
              myDate: '2026-02-03' as unknown as CalendarDate,
              myDatetime: '2026-02-03T10:23:45.123456' as unknown as DateTime,
              myDatetimeTz: '2026-02-03T10:23:45.123456' as unknown as DateTime,
              myTimeWithZone: '10:23:45.123456' as unknown as ClockTime,
              myTimeWithoutZone: '10:23:45.123456' as unknown as ClockTime,
            })

            const typeModel2 = await ModelForDatabaseTypeSpec.create({
              pet: pet2,
              myDate: '2026-02-04' as unknown as CalendarDate,
              myDatetime: '2026-02-04T10:23:45.123456' as unknown as DateTime,
              myDatetimeTz: '2026-02-04T10:23:45.123456' as unknown as DateTime,
              myTimeWithZone: '15:23:45.123456' as unknown as ClockTime,
              myTimeWithoutZone: '15:23:45.123456' as unknown as ClockTime,
            })

            const reloadedUsers = await User.query()
              .innerJoin('pets', 'modelsForDatabaseTypeSpec as M1', {
                and: { myTimeWithZone: typeModel2.myTimeWithZone },
              })
              .all()
            expect(reloadedUsers).toMatchDreamModels([user2])
          })
        }
      )
    })

    context('sibling joins', () => {
      it('loads specified associations', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ userId: user.id, primary: true })
        const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })

        const reloadedUsers = await User.query()
          .innerJoin('compositions', { and: { id: composition.id } })
          .innerJoin('mainComposition', 'compositionAssets', { and: { id: compositionAsset.id } })
          .all()
        expect(reloadedUsers).toMatchDreamModels([user])

        const noResults1 = await User.query()
          .innerJoin('compositions', { and: { id: (parseInt(composition.id.toString()) + 1).toString() } })
          .innerJoin('mainComposition', 'compositionAssets', { and: { id: compositionAsset.id } })
          .all()
        expect(noResults1).toEqual([])

        const noResults2 = await User.query()
          .innerJoin('compositions', { and: { id: composition.id } })
          .innerJoin('mainComposition', 'compositionAssets', {
            and: { id: (parseInt(compositionAsset.id.toString()) + 1).toString() },
          })
          .all()
        expect(noResults2).toEqual([])
      })
    })
  })

  context('HasMany', () => {
    context('with matching and-clause-on-the-association', () => {
      it('loads the associated object', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Composition.create({
          user,
          createdAt: DateTime.now().minus({ day: 1 }),
        })

        const reloadedUser = await User.innerJoin('recentCompositions').first()
        expect(reloadedUser).toMatchDreamModel(user)
      })
    })

    context('with NON-matching and-clause-on-the-association', () => {
      it('does not load the object', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Composition.create({
          user,
          createdAt: DateTime.now().minus({ year: 1 }),
        })

        const reloadedUser = await User.innerJoin('recentCompositions').first()
        expect(reloadedUser).toBeNull()
      })
    })

    context('with matching andNot-clause-on-the-association', () => {
      it('does not load the object', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Composition.create({
          user,
          createdAt: DateTime.now().minus({ day: 1 }),
        })

        const reloadedUser = await User.innerJoin('notRecentCompositions').first()
        expect(reloadedUser).toBeNull()
      })
    })

    context('with NON-matching andNot-clause-on-the-association', () => {
      it('loads the associated object', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Composition.create({
          user,
          createdAt: DateTime.now().minus({ year: 1 }),
        })

        const reloadedUser = await User.innerJoin('notRecentCompositions').first()
        expect(reloadedUser).toMatchDreamModel(user)
      })
    })

    context('with order-clause-on-the-association', () => {
      it('loads the associated object', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Composition.create({
          user,
        })

        const reloadedUser = await User.innerJoin('sortedCompositions').first()
        expect(reloadedUser).toMatchDreamModel(user)
      })
    })

    context('pointing to an STI model', () => {
      it('loads the association', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Mylar.create({ user, color: 'blue' })

        const reloadedUser = await User.query().innerJoin('balloons').first()
        expect(reloadedUser).toMatchDreamModel(user)
      })
    })
  })

  context('HasOne', () => {
    context('with matching and-clause-on-the-association', () => {
      it('loads the associated object', async () => {
        const pet = await Pet.create()
        await pet.createAssociation('collars', {
          lost: false,
        })

        const reloaded = await Pet.innerJoin('currentCollar').first()
        expect(reloaded).toMatchDreamModel(pet)
      })
    })

    context('with NON-matching and-clause-on-the-association', () => {
      it('does not load the object', async () => {
        const pet = await Pet.create()
        await pet.createAssociation('collars', {
          lost: true,
        })

        const reloaded = await Pet.innerJoin('currentCollar').first()
        expect(reloaded).toBeNull()
      })
    })

    context('with matching andNot-clause-on-the-association', () => {
      it('does not load the associated object', async () => {
        const pet = await Pet.create()
        await pet.createAssociation('collars', {
          lost: true,
        })

        const reloaded = await Pet.innerJoin('notLostCollar').first()
        expect(reloaded).toBeNull()
      })
    })

    context('with NON-matching andNot-clause-on-the-association', () => {
      it('loads the associated object', async () => {
        const pet = await Pet.create()
        await pet.createAssociation('collars', {
          lost: false,
        })

        const reloaded = await Pet.innerJoin('notLostCollar').first()
        expect(reloaded).toMatchDreamModel(pet)
      })
    })
  })

  context('when the model and its association have a default scope with the same attribute name', () => {
    it('namespaces the scope', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Pet.create({ user })
      const reloadedUser = await User.where({ email: user.email }).innerJoin('pets').first()
      // prior to fixing, this line would throw:
      //   error: column reference "deleted_at" is ambiguous
      expect(reloadedUser).toMatchDreamModel(user)
    })

    it('applies the default scope on the associated class', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      await Pet.create({ user: user1, name: 'Snoopy', deletedAt: DateTime.now() })
      await Pet.create({ user: user2, name: 'Woodstock' })

      const users = await User.innerJoin('pets').all()
      expect(users).toMatchDreamModels([user2])
    })
  })

  context('date range condition', () => {
    const begin = DateTime.now()

    let user0: User
    let user1: User
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

      await Pet.create({ user: user0 })
      pet1 = await Pet.create({ user: user1 })
    })

    it('is able to apply date ranges to and-clause', async () => {
      const pets = await Pet.innerJoin('user', { and: { createdAt: range(begin.plus({ hour: 1 })) } }).all()
      expect(pets).toMatchDreamModels([pet1])
    })
  })

  context('with default scopes on the joined models', () => {
    context('joining a HasMany', () => {
      it('applies default scopes when joining', async () => {
        const pet = await Pet.create({ name: 'aster' })
        await pet.createAssociation('collars', { tagName: 'Aster', pet, hidden: true })

        const results = await Pet.innerJoin('collars').all()
        expect(results).toHaveLength(0)
      })
    })

    context('joining a BelongsTo', () => {
      it('applies default scopes when joining', async () => {
        const pet = await Pet.create({ name: 'aster' })
        await pet.createAssociation('collars', { tagName: 'Aster', pet })
        await pet.destroy()

        const results = await Collar.innerJoin('pet').all()
        expect(results).toHaveLength(0)
      })
    })
  })

  context('join + on-statement more than one level deep', () => {
    it('does not leak between clones', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const pet = await user.createAssociation('pets', { name: 'aster' })
      await pet.createAssociation('collars', { tagName: 'Aster', pet })
      const baseScope = User.innerJoin('pets')

      const results = await baseScope
        .innerJoin('pets', 'collars')
        .whereAny([
          {
            id: baseScope
              .innerJoin('pets', 'collars', { and: { tagName: 'Aster' } })
              .nestedSelect('pets.userId'),
          },
          {
            id: baseScope
              .innerJoin('pets', 'collars', { and: { tagName: 'Snoopy' } })
              .nestedSelect('pets.userId'),
          },
        ])
        .limit(1)
        .all()

      expect(results).toMatchDreamModels([user])
    })
  })
})
