import { NonLoadedAssociation } from '../../../src/index.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset.js'
import Pet from '../../../test-app/app/models/Pet.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream#leftJoinLoad', () => {
  let user: User
  let pet: Pet

  beforeEach(async () => {
    user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
    pet = await user.createAssociation('pets', { species: 'cat', name: 'aster' })
  })

  it('returns a clone of the dream instance in its current state', async () => {
    const freshUser = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })
    freshUser.name = 'Snoopy Snoopy Snoopy'
    const freshPet = await Pet.create({ user: freshUser, species: 'dog', name: 'Snoopy' })
    const clone = await freshUser.leftJoinLoad('pets').execute()
    expect(clone).toMatchDreamModel(freshUser)
    expect(clone).not.toBe(freshUser)

    expect(clone.name).toEqual('Snoopy Snoopy Snoopy')
    expect(clone.pets).toMatchDreamModels([freshPet])
    expect(() => freshUser.pets).toThrow(NonLoadedAssociation)
  })

  it('includes previously loaded associations', async () => {
    const composition = await Composition.create({ user })
    const clone = await user.leftJoinLoad('pets').execute()
    const clone2 = await clone.leftJoinLoad('compositions').execute()

    expect(clone2.pets).toMatchDreamModels([pet])
    expect(clone2.compositions).toMatchDreamModels([composition])
  })

  context('with a transaction', () => {
    it('loads the association', async () => {
      let pets: Pet[] = []
      await ApplicationModel.transaction(async txn => {
        await user.txn(txn).createAssociation('pets', { species: 'dog', name: 'violet' })
        user = await user.txn(txn).leftJoinLoad('pets').execute()
        pets = user.pets
      })

      expect(pets.map(p => p.name)).toEqual(['aster', 'violet'])
    })
  })

  context('Has(One/Many) association', () => {
    it('loads the association', async () => {
      const clone = await user.leftJoinLoad('pets').execute()
      expect(clone.pets).toMatchDreamModels([await Pet.findBy({ name: 'aster' })])
    })
  })

  context('BelongsTo association', () => {
    it('loads the association', async () => {
      const clone = await pet.leftJoinLoad('user').execute()
      expect(clone.user).toMatchDreamModel(await User.findBy({ email: 'fred@fred' }))
    })
  })

  context('through associations', () => {
    it('loads the association', async () => {
      const composition = await user.createAssociation('compositions')
      const compositionAsset = await composition?.createAssociation('compositionAssets', {
        name: 'compositionAsset X',
      })
      const clone = await user.leftJoinLoad('compositionAssets').execute()
      expect(clone.compositionAssets).toMatchDreamModels([compositionAsset])
    })
  })

  context('aliased association names', () => {
    it('correctly aliases', async () => {
      const clone = await user.leftJoinLoad('pets as p').execute()
      expect(clone.pets).toMatchDreamModels([await Pet.findBy({ name: 'aster' })])
    })
  })

  context('when called twice', () => {
    context('Has(One/Many) association', () => {
      it('loads the association fresh from the database', async () => {
        const clone = await user.leftJoinLoad('pets').execute()
        await Pet.query().update({ name: 'Snoopy' })
        const clone2 = await clone.leftJoinLoad('pets').execute()
        expect(clone.pets[0]!.name).toEqual('aster')
        expect(clone2.pets[0]!.name).toEqual('Snoopy')
      })
    })

    context('BelongsTo association', () => {
      it('loads the association fresh from the database', async () => {
        const clone = await pet.leftJoinLoad('user').execute()
        await User.query().update({ email: 'lucy@peanuts.com' })
        const clone2 = await clone.leftJoinLoad('user').execute()
        expect(clone2.user!.email).toEqual('lucy@peanuts.com')
      })
    })

    context('through associations', () => {
      it('loads the association fresh from the database', async () => {
        const composition = await user.createAssociation('compositions')
        await composition.createAssociation('compositionAssets', {
          name: 'compositionAsset X',
        })
        const clone = await user.leftJoinLoad('compositionAssets').execute()
        await CompositionAsset.query().update({ name: 'hello' })
        const clone2 = await clone.leftJoinLoad('compositionAssets').execute()
        expect(clone2.compositionAssets[0]!.name).toEqual('hello')
      })
    })

    it('allows chaining load statements', async () => {
      const composition = await user.createAssociation('compositions')
      await composition?.createAssociation('compositionAssets', {
        name: 'compositionAsset X',
      })
      const clone = await user.leftJoinLoad('compositionAssets').leftJoinLoad('pets').execute()
      expect(clone.compositionAssets[0]!.name).toEqual('compositionAsset X')
      expect(clone.pets[0]!.name).toEqual('aster')
    })
  })
})
