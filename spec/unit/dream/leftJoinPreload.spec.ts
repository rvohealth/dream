import LeftJoinPreloadIncompatibleWithFindEach from '../../../src/errors/LeftJoinPreloadIncompatibleWithFindEach'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import Latex from '../../../test-app/app/models/Balloon/Latex'
import Mylar from '../../../test-app/app/models/Balloon/Mylar'
import Collar from '../../../test-app/app/models/Collar'
import Composition from '../../../test-app/app/models/Composition'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'
import CompositionAssetAudit from '../../../test-app/app/models/CompositionAssetAudit'
import Pet from '../../../test-app/app/models/Pet'
import User from '../../../test-app/app/models/User'

describe('Dream.leftJoinPreload', () => {
  it('loads a HasOne association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user })
    const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })
    await CompositionAssetAudit.create({
      compositionAssetId: compositionAsset.id,
    })

    const reloaded = (await CompositionAssetAudit.leftJoinPreload('compositionAsset').all())[0]
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
      CompositionAssetAudit.leftJoinPreload('compositionAsset').findEach(dream => console.debug(dream))
    ).rejects.toThrow(LeftJoinPreloadIncompatibleWithFindEach)
  })

  it('supports where clauses', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await Composition.create({ user, content: 'hello' })
    const composition = await Composition.create({ user, content: 'goodbye' })

    const reloaded = (
      await User.leftJoinPreload('compositions', { on: { content: 'goodbye' } })
        .order('users.birthdate')
        .all()
    )[0]
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

  context('with multiple levels of joining', () => {
    it('does not duplicate top level results or intermediate results', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const pet1 = await Pet.create({ user, name: 'a' })
      const collar1a = await Collar.create({ pet: pet1 })
      const collar1b = await Collar.create({ pet: pet1 })

      const pet2 = await Pet.create({ user, name: 'b' })
      const collar2a = await Collar.create({ pet: pet2 })
      const collar2b = await Collar.create({ pet: pet2 })

      const users = await User.leftJoinPreload('pets', 'collars').all()

      expect(await User.count()).toEqual(1)
      expect(users.length).toEqual(1)

      expect(users[0].pets.length).toEqual(2)
      expect(users[0].pets).toMatchDreamModels([pet1, pet2])

      expect(users[0].pets[0].collars.length).toEqual(2)
      expect(users[0].pets[0].collars).toMatchDreamModels([collar1a, collar1b])

      expect(users[0].pets[1].collars.length).toEqual(2)
      expect(users[0].pets[1].collars).toMatchDreamModels([collar2a, collar2b])
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

        const users = await User.leftJoinPreload('pets', 'collars').all()

        expect(await User.count()).toEqual(2)
        expect(users.length).toEqual(2)

        expect(users[0].pets.length).toEqual(2)
        expect(users[0].pets).toMatchDreamModels([pet1, pet2])

        expect(users[0].pets[0].collars.length).toEqual(2)
        expect(users[0].pets[0].collars).toMatchDreamModels([collar1a, collar1b])

        expect(users[0].pets[1].collars.length).toEqual(2)
        expect(users[0].pets[1].collars).toMatchDreamModels([collar2a, collar2b])

        expect(users[1].pets.length).toEqual(0)
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
        )[0]
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
      expect(users[0].balloons).toMatchDreamModels([mylar, latex])
    })
  })
})
