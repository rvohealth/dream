import { NonLoadedAssociation } from '../../../src'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import Latex from '../../../test-app/app/models/Balloon/Latex'
import Mylar from '../../../test-app/app/models/Balloon/Mylar'
import Composition from '../../../test-app/app/models/Composition'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'
import CompositionAssetAudit from '../../../test-app/app/models/CompositionAssetAudit'
import Pet from '../../../test-app/app/models/Pet'
import User from '../../../test-app/app/models/User'

describe('Dream.joinLoad', () => {
  it('loads a HasOne association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user })
    const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })
    await CompositionAssetAudit.create({
      compositionAssetId: compositionAsset.id,
    })

    const reloaded = (await CompositionAssetAudit.preloadJoin('compositionAsset').all())[0]
    expect(reloaded.compositionAsset).toMatchDreamModel(compositionAsset)
  })

  it('supports where clauses', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await Composition.create({ user, content: 'hello' })
    const composition = await Composition.create({ user, content: 'goodbye' })

    const reloaded = (
      await User.preloadJoin('compositions', { content: 'goodbye' }).order('birthdate').all()
    )[0]
    expect(reloaded.compositions).toMatchDreamModels([composition])
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
          await CompositionAssetAudit.txn(txn).joinLoad('compositionAsset').all()
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

      const users = await User.preloadJoin('balloons').all()
      expect(users[0].balloons).toMatchDreamModels([mylar, latex])
    })
  })

  context('from a Dream instance', () => {
    let user: User
    let pet: Pet

    beforeEach(async () => {
      user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      pet = await user.createAssociation('pets', { species: 'cat', name: 'aster' })
    })

    it('returns a copy of the dream instance', async () => {
      const clone = await user.joinLoad('pets').execute()
      expect(clone).toMatchDreamModel(user)
      expect(clone).not.toBe(user)

      expect(clone.pets).toMatchDreamModels([pet])
      expect(() => user.pets).toThrow(NonLoadedAssociation)
    })

    context('with a transaction', () => {
      it('joinLoads the association', async () => {
        let pets: Pet[] = []
        await ApplicationModel.transaction(async txn => {
          await user.txn(txn).createAssociation('pets', { species: 'dog', name: 'violet' })
          user = await user.txn(txn).joinLoad('pets').execute()
          pets = user.pets
        })

        expect(pets.map(p => p.name)).toEqual(['aster', 'violet'])
      })
    })

    context('Has(One/Many) association', () => {
      it('joinLoads the association', async () => {
        const clone = await user.joinLoad('pets').execute()
        expect(clone.pets).toMatchDreamModels([await Pet.findBy({ name: 'aster' })])
      })
    })

    context('BelongsTo association', () => {
      it('joinLoads the association', async () => {
        const clone = await pet.joinLoad('user').execute()
        expect(clone.user).toMatchDreamModel(await User.findBy({ email: 'fred@fred' }))
      })
    })

    context('through associations', () => {
      it('joinLoads the association', async () => {
        const composition = await user.createAssociation('compositions')
        const compositionAsset = await composition?.createAssociation('compositionAssets', {
          name: 'compositionAsset X',
        })
        const clone = await user.joinLoad('compositionAssets').execute()
        expect(clone.compositionAssets).toMatchDreamModels([compositionAsset])
      })
    })
  })
})
