import { Dream } from '../../../src'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'
import Pet from '../../../test-app/app/models/Pet'
import User from '../../../test-app/app/models/User'

describe('Dream#load', () => {
  beforeEach(async () => {
    const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
    await user.createAssociation('pets', { species: 'cat', name: 'aster' })
  })

  it('loads an association', async () => {
    const user = await User.last()
    await user!.load('pets')
    expect(user!.pets).toMatchDreamModels([await Pet.findBy({ name: 'aster' })])
  })

  context('when called twice', () => {
    context('Has(One/Many) association', () => {
      it('loads the association', async () => {
        const user = await User.last()
        await user!.load('pets')
        await user!.load('pets')
        expect(user!.pets).toMatchDreamModels([await Pet.findBy({ name: 'aster' })])
      })
    })

    context('BelongsATo association', () => {
      it('loads the association', async () => {
        const pet = await Pet.last()
        await pet!.load('user')
        await pet!.load('user')
        expect(pet!.user).toMatchDreamModel(await User.findBy({ email: 'fred@fred' }))
      })
    })

    context('through associations', () => {
      beforeEach(async () => {
        const user = await User.findBy({ email: 'fred@fred' })
        const composition = await user?.createAssociation('compositions', { name: 'hwoyadoin' })
        const compositionAsset = await composition?.createAssociation('compositionAssets', {
          name: 'hwoyadoin',
        })
      })
      it('loads the association', async () => {
        const user = await User.last()
        await user!.load('compositionAssets')
        await user!.load('compositionAssets')
        expect(user!.compositionAssets).toMatchDreamModels([await CompositionAsset.last()])
      })
    })
  })
})
