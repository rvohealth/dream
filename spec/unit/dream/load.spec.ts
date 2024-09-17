import { NonLoadedAssociation } from '../../../src'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'
import Pet from '../../../test-app/app/models/Pet'
import User from '../../../test-app/app/models/User'

describe('Dream#load', () => {
  let user: User
  let pet: Pet

  beforeEach(async () => {
    user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
    pet = await user.createAssociation('pets', { species: 'cat', name: 'aster' })
  })

  it('returns a copy of the dream instance', async () => {
    const freshUser = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })
    const freshPet = await freshUser.createAssociation('pets', { species: 'dog', name: 'Snoopy' })
    const clone = await freshUser.load('pets').execute()
    expect(clone).toMatchDreamModel(freshUser)
    expect(clone).not.toBe(freshUser)

    expect(clone.pets).toMatchDreamModels([freshPet])
    expect(() => freshUser.pets).toThrow(NonLoadedAssociation)
  })

  context('with a transaction', () => {
    it('loads the association', async () => {
      let pets: Pet[] = []
      await ApplicationModel.transaction(async txn => {
        await user.txn(txn).createAssociation('pets', { species: 'dog', name: 'violet' })
        user = await user.txn(txn).load('pets').execute()
        pets = user.pets
      })

      expect(pets.map(p => p.name)).toEqual(['aster', 'violet'])
    })
  })

  context('Has(One/Many) association', () => {
    it('loads the association', async () => {
      const clone = await user.load('pets').execute()
      expect(clone.pets).toMatchDreamModels([await Pet.findBy({ name: 'aster' })])
    })
  })

  context('BelongsTo association', () => {
    it('loads the association', async () => {
      const clone = await pet.load('user').execute()
      expect(clone.user).toMatchDreamModel(await User.findBy({ email: 'fred@fred' }))
    })
  })

  context('through associations', () => {
    it('loads the association', async () => {
      const composition = await user.createAssociation('compositions')
      const compositionAsset = await composition?.createAssociation('compositionAssets', {
        name: 'compositionAsset X',
      })
      const clone = await user.load('compositionAssets').execute()
      expect(clone.compositionAssets).toMatchDreamModels([compositionAsset])
    })
  })

  context('when called twice', () => {
    context('Has(One/Many) association', () => {
      it('loads the association fresh from the database', async () => {
        const clone = await user.load('pets').execute()
        await Pet.query().update({ name: 'Snoopy' })
        const clone2 = await clone.load('pets').execute()
        expect(clone.pets[0].name).toEqual('aster')
        expect(clone2.pets[0].name).toEqual('Snoopy')
      })
    })

    context('BelongsTo association', () => {
      it('loads the association fresh from the database', async () => {
        const clone = await pet.load('user').execute()
        await User.query().update({ email: 'lucy@peanuts.com' })
        const clone2 = await clone.load('user').execute()
        expect(clone2.user!.email).toEqual('lucy@peanuts.com')
      })
    })

    context('through associations', () => {
      it('loads the association fresh from the database', async () => {
        const composition = await user.createAssociation('compositions')
        await composition.createAssociation('compositionAssets', {
          name: 'compositionAsset X',
        })
        const clone = await user.load('compositionAssets').execute()
        await CompositionAsset.query().update({ name: 'hello' })
        const clone2 = await clone.load('compositionAssets').execute()
        expect(clone2.compositionAssets[0].name).toEqual('hello')
      })
    })

    it('allows chaining load statements', async () => {
      const composition = await user.createAssociation('compositions')
      await composition?.createAssociation('compositionAssets', {
        name: 'compositionAsset X',
      })
      const clone = await user.load('compositionAssets').load('pets').execute()
      expect(clone.compositionAssets[0].name).toEqual('compositionAsset X')
      expect(clone.pets[0].name).toEqual('aster')
    })
  })
})
