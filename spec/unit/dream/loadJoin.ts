import { NonLoadedAssociation } from '../../../src'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import Pet from '../../../test-app/app/models/Pet'
import User from '../../../test-app/app/models/User'

describe('Dream#joinLoad', () => {
  let user: User
  let pet: Pet

  beforeEach(async () => {
    user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
    pet = await user.createAssociation('pets', { species: 'cat', name: 'aster' })
  })

  it('returns a copy of the dream instance', async () => {
    const clone = await user.loadJoin('pets').execute()
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
      const clone = await user.loadJoin('pets').execute()
      expect(clone.pets).toMatchDreamModels([await Pet.findBy({ name: 'aster' })])
    })
  })

  context('BelongsTo association', () => {
    it('joinLoads the association', async () => {
      const clone = await pet.loadJoin('user').execute()
      expect(clone.user).toMatchDreamModel(await User.findBy({ email: 'fred@fred' }))
    })
  })

  context('through associations', () => {
    it('joinLoads the association', async () => {
      const composition = await user.createAssociation('compositions')
      const compositionAsset = await composition?.createAssociation('compositionAssets', {
        name: 'compositionAsset X',
      })
      const clone = await user.loadJoin('compositionAssets').execute()
      expect(clone.compositionAssets).toMatchDreamModels([compositionAsset])
    })
  })
})
