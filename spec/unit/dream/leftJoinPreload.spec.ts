import LeftJoinPreloadIncompatibleWithFindEach from '../../../src/errors/LeftJoinPreloadIncompatibleWithFindEach.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Latex from '../../../test-app/app/models/Balloon/Latex.js'
import Mylar from '../../../test-app/app/models/Balloon/Mylar.js'
import Collar from '../../../test-app/app/models/Collar.js'
import Composition from '../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset.js'
import CompositionAssetAudit from '../../../test-app/app/models/CompositionAssetAudit.js'
import HeartRating from '../../../test-app/app/models/ExtraRating/HeartRating.js'
import Pet from '../../../test-app/app/models/Pet.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.leftJoinPreload', () => {
  it('loads a HasOne association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user })
    const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })
    await CompositionAssetAudit.create({
      compositionAssetId: compositionAsset.id,
    })

    const reloaded = (await CompositionAssetAudit.leftJoinPreload('compositionAsset').all())[0]!
    expect(reloaded.compositionAsset).toMatchDreamModel(compositionAsset)
  })

  it('is incompatible with findEach', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user })
    const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })
    await CompositionAssetAudit.create({
      compositionAssetId: compositionAsset.id,
    })

    await expect(
      CompositionAssetAudit.leftJoinPreload('compositionAsset').findEach(() => null as any)
    ).rejects.toThrow(LeftJoinPreloadIncompatibleWithFindEach)
  })

  it('supports where clauses', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await Composition.create({ user, content: 'hello' })
    const composition = await Composition.create({ user, content: 'goodbye' })

    const reloaded = (
      await User.leftJoinPreload('compositions', { and: { content: 'goodbye' } })
        .order('users.birthdate')
        .all()
    )[0]!
    expect(reloaded.compositions).toMatchDreamModels([composition])
  })

  it('does not duplicate top level results', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await Pet.create({ user, name: 'a' })
    await Pet.create({ user, name: 'b' })

    const users = await User.leftJoinPreload('pets').all()
    expect(await User.count()).toEqual(1)
    expect(users.length).toEqual(1)
  })

  context('with an association provided as an argument to the and clause', () => {
    it('supports associations as clauses', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ user, content: 'hello' })
      const composition = await Composition.create({ user, content: 'goodbye' })
      const heartRating = await HeartRating.create({ extraRateable: composition, user })

      const composition2 = await Composition.create({ user, content: 'goodbye' })
      await HeartRating.create({ extraRateable: composition2, user })

      const reloaded = await User.leftJoinPreload('heartRatings', {
        and: { extraRateable: composition },
      }).first()
      expect(reloaded!.heartRatings).toMatchDreamModels([heartRating])
    })
  })

  context('with multiple levels of joining', () => {
    it('does not duplicate top level results or intermediate results', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const pet1 = await Pet.create({ user, name: 'a' })
      const collar1a = await Collar.create({ pet: pet1 })
      const collar1b = await Collar.create({ pet: pet1 })

      const pet2 = await Pet.create({ user, name: 'b' })
      const collar2a = await Collar.create({ pet: pet2 })
      const collar2b = await Collar.create({ pet: pet2 })

      const users = await User.leftJoinPreload('pets', 'collars').order('pets.name').all()

      expect(await User.count()).toEqual(1)
      expect(users.length).toEqual(1)

      expect(users[0]!.pets.length).toEqual(2)
      expect(users[0]!.pets).toMatchDreamModels([pet1, pet2])

      expect(users[0]!.pets[0]!.collars.length).toEqual(2)
      expect(users[0]!.pets[0]!.collars).toMatchDreamModels([collar1a, collar1b])

      expect(users[0]!.pets[1]!.collars.length).toEqual(2)
      expect(users[0]!.pets[1]!.collars).toMatchDreamModels([collar2a, collar2b])
    })

    context('some models without the next level', () => {
      it('loads those models with associations initialized to null/[]', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

        const pet1 = await Pet.create({ user, name: 'a' })
        const collar1a = await Collar.create({ pet: pet1 })
        const collar1b = await Collar.create({ pet: pet1 })

        const pet2 = await Pet.create({ user, name: 'b' })
        const collar2a = await Collar.create({ pet: pet2 })
        const collar2b = await Collar.create({ pet: pet2 })

        await User.create({ email: 'gred@frewd', password: 'howyadoin' })

        const users = await User.leftJoinPreload('pets', 'collars').order('pets.name').all()

        expect(await User.count()).toEqual(2)
        expect(users.length).toEqual(2)

        expect(users[0]!.pets.length).toEqual(0)

        expect(users[1]!.pets.length).toEqual(2)
        expect(users[1]!.pets).toMatchDreamModels([pet1, pet2])

        expect(users[1]!.pets[0]!.collars.length).toEqual(2)
        expect(users[1]!.pets[0]!.collars).toMatchDreamModels([collar1a, collar1b])

        expect(users[1]!.pets[1]!.collars.length).toEqual(2)
        expect(users[1]!.pets[1]!.collars).toMatchDreamModels([collar2a, collar2b])
      })
    })
  })

  context('within a transaction', () => {
    it('loads a HasOne association', async () => {
      let reloadedCompositionAssetAudit: CompositionAssetAudit | null = null
      let compositionAsset: CompositionAsset | null = null
      await ApplicationModel.transaction(async txn => {
        const user = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.txn(txn).create({ user })
        compositionAsset = await CompositionAsset.txn(txn).create({ composition })
        await CompositionAssetAudit.txn(txn).create({
          compositionAsset,
        })

        reloadedCompositionAssetAudit = (
          await CompositionAssetAudit.txn(txn).leftJoinPreload('compositionAsset').all()
        )[0]!
      })

      expect(reloadedCompositionAssetAudit!.compositionAsset).toMatchDreamModel(compositionAsset)
    })
  })

  context('STI associations are loaded', () => {
    it('correctly marshals each association to its respective dream class based on type', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const mylar = await Mylar.create({ user, color: 'red' })
      const latex = await Latex.create({ user, color: 'blue' })

      const users = await User.leftJoinPreload('balloons').all()
      expect(users[0]!.balloons).toMatchDreamModels([mylar, latex])
    })
  })
})

// type tests intentionally skipped, since they will fail on build instead.
context.skip('type tests', () => {
  it('ensures invalid arguments error', () => {
    User
      // @ts-expect-error intentionally passing invalid arg to test that type protection is working
      .leftJoinPreload('invalid')

    User
      // @ts-expect-error intentionally passing invalid arg to test that type protection is working
      .leftJoinPreload('allPets', { and: { invalidArg: 123 } })
  })

  context('in a transaction', () => {
    it('ensures invalid arguments error', async () => {
      await ApplicationModel.transaction(txn => {
        User.txn(txn)
          // @ts-expect-error intentionally passing invalid arg to test that type protection is working
          .leftJoinPreload('invalid')

        User.txn(txn).leftJoinPreload('allPets', {
          and: {
            // @ts-expect-error intentionally passing invalid arg to test that type protection is working
            invalidArg: 123,
          },
        })
      })
    })
  })
})
