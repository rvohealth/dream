import { Dream } from '../../../src'
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

  context('Has(One/Many) association', () => {
    it('loads the association', async () => {
      await user.load('pets').execute()
      expect(user.pets).toMatchDreamModels([await Pet.findBy({ name: 'aster' })])
    })
  })

  context('BelongsATo association', () => {
    it('loads the association', async () => {
      await pet.load('user').execute()
      expect(pet.user).toMatchDreamModel(await User.findBy({ email: 'fred@fred' }))
    })
  })

  context('through associations', () => {
    it('loads the association', async () => {
      const composition = await user.createAssociation('compositions', { name: 'composition A' })
      const compositionAsset = await composition?.createAssociation('compositionAssets', {
        name: 'compositionAsset X',
      })
      await user.load('compositionAssets').execute()
      expect(user.compositionAssets).toMatchDreamModels([compositionAsset])
    })
  })

  context('when called twice', () => {
    context('Has(One/Many) association', () => {
      it('loads the first time, then reloads', async () => {
        await user.load('pets').execute()
        await pet.update({ name: 'Snoopy' })
        await user.load('pets').execute()
        expect(user.pets).toMatchDreamModels([await Pet.findBy({ name: 'Snoopy' })])
      })
    })

    context('BelongsATo association', () => {
      it('loads the first time, then reloads', async () => {
        await pet.load('user').execute()
        await user.update({ email: 'lucy@peanuts.com' })
        await pet.load('user').execute()
        expect(pet.user).toMatchDreamModel(await User.findBy({ email: 'lucy@peanuts.com' }))
      })
    })

    context('through associations', () => {
      it('loads the first time, then reloads', async () => {
        const composition = await user.createAssociation('compositions', { name: 'composition A' })
        const compositionAsset = await composition?.createAssociation('compositionAssets', {
          name: 'compositionAsset X',
        })
        await user.load('compositionAssets').execute()
        await compositionAsset.update({ name: 'hello' })
        await user.load('compositionAssets').execute()
        expect(user.compositionAssets![0].name).toEqual('hello')
      })
    })

    it('allows chaining load statements', async () => {
      const composition = await user.createAssociation('compositions', { name: 'composition A' })
      const compositionAsset = await composition?.createAssociation('compositionAssets', {
        name: 'compositionAsset X',
      })
      await user.load('compositionAssets').load('pets').execute()
      expect(user.compositionAssets![0].name).toEqual('compositionAsset X')
      expect(user.pets![0].name).toEqual('aster')
    })
  })
})
