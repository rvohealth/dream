import { Dream, NonLoadedAssociation } from '../../../src'
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
    const clone = await user.load('pets').execute()
    expect(clone).toMatchDreamModel(user)
    expect(clone).not.toBe(user)

    expect(clone.pets).toMatchDreamModels([pet])
    expect(() => user.pets).toThrowError(NonLoadedAssociation)
  })

  context('Has(One/Many) association', () => {
    it('loads the association', async () => {
      const clone = await user.load('pets').execute()
      expect(clone.pets).toMatchDreamModels([await Pet.findBy({ name: 'aster' })])
    })
  })

  context('BelongsATo association', () => {
    it('loads the association', async () => {
      const clone = await pet.load('user').execute()
      expect(clone.user).toMatchDreamModel(await User.findBy({ email: 'fred@fred' }))
    })
  })

  context('through associations', () => {
    it('loads the association', async () => {
      const composition = await user.createAssociation('compositions', { name: 'composition A' })
      const compositionAsset = await composition?.createAssociation('compositionAssets', {
        name: 'compositionAsset X',
      })
      const clone = await user.load('compositionAssets').execute()
      expect(clone.compositionAssets).toMatchDreamModels([compositionAsset])
    })
  })

  context('when called twice', () => {
    context('Has(One/Many) association', () => {
      it('loads the first time, then reloads', async () => {
        const clone = await user.load('pets').execute()
        await pet.update({ name: 'Snoopy' })
        const clone2 = await user.load('pets').execute()
        expect(clone2.pets).toMatchDreamModels([await Pet.findBy({ name: 'Snoopy' })])
        expect(clone2.pets).not.toEqual(clone.pets)
      })
    })

    context('BelongsATo association', () => {
      it('loads the first time, then reloads', async () => {
        const clone = await pet.load('user').execute()
        await user.update({ email: 'lucy@peanuts.com' })
        const clone2 = await pet.load('user').execute()
        expect(clone2.user).toMatchDreamModel(await User.findBy({ email: 'lucy@peanuts.com' }))
        expect(clone2.user).not.toEqual(clone.user)
      })
    })

    context('through associations', () => {
      it('loads the first time, then reloads', async () => {
        const composition = await user.createAssociation('compositions', { name: 'composition A' })
        const compositionAsset = await composition?.createAssociation('compositionAssets', {
          name: 'compositionAsset X',
        })
        const clone = await user.load('compositionAssets').execute()
        await compositionAsset.update({ name: 'hello' })
        const clone2 = await user.load('compositionAssets').execute()
        expect(clone2.compositionAssets![0].name).toEqual('hello')
        expect(clone2.compositionAssets).not.toEqual(clone.compositionAssets)
      })
    })

    it('allows chaining load statements', async () => {
      const composition = await user.createAssociation('compositions', { name: 'composition A' })
      await composition?.createAssociation('compositionAssets', {
        name: 'compositionAsset X',
      })
      const clone = await user.load('compositionAssets').load('pets').execute()
      expect(clone.compositionAssets![0].name).toEqual('compositionAsset X')
      expect(clone.pets![0].name).toEqual('aster')
    })
  })
})
