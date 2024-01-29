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

  // this is skipped, since it is only here to ensure that types are working
  // from args a-g, which does not actually need to be run, since if this is
  // broken, tests will fail to compile due to type errors
  it.skip('permits types a-g', async () => {
    await user.load('pets', 'collars', 'pet', 'collars', 'pet').execute()
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
      it('loads the association fresh from the database', async () => {
        const clone = await user.load('pets').execute()
        await Pet.query().updateAll({ name: 'Snoopy' })
        const clone2 = await clone.load('pets').execute()
        expect(clone2.pets[0].name).toEqual('Snoopy')
      })
    })

    context('BelongsTo association', () => {
      it('loads the association fresh from the database', async () => {
        const clone = await pet.load('user').execute()
        await User.query().updateAll({ email: 'lucy@peanuts.com' })
        const clone2 = await clone.load('user').execute()
        expect(clone2.user!.email).toEqual('lucy@peanuts.com')
      })
    })

    context('through associations', () => {
      it('loads the association fresh from the database', async () => {
        const composition = await user.createAssociation('compositions', { name: 'composition A' })
        const compositionAsset = await composition?.createAssociation('compositionAssets', {
          name: 'compositionAsset X',
        })
        const clone = await user.load('compositionAssets').execute()
        await CompositionAsset.query().updateAll({ name: 'hello' })
        const clone2 = await clone.load('compositionAssets').execute()
        expect(clone2.compositionAssets![0].name).toEqual('hello')
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
