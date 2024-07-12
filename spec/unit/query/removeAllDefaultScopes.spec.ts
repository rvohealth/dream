import User from '../../../test-app/app/models/User'
import Pet from '../../../test-app/app/models/Pet'

describe('Dream#removeAllDefaultScopes', () => {
  let user: User
  let pet: Pet
  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    pet = await Pet.create({ user })
  })

  it('circumvents default scopes to provide otherwise-hidden records', async () => {
    await pet.destroy()
    const reloadedPet = await Pet.query().removeAllDefaultScopes().where({ id: pet.id }).first()
    expect(reloadedPet).toMatchDreamModel(pet)
  })
})
