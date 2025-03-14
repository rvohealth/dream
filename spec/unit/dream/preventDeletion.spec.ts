import Pet from '../../../test-app/app/models/Pet.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream#preventDeletion', () => {
  let user: User
  let pet: Pet
  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    pet = await Pet.create({ user })
  })

  it('cancels the deleting of a record, allowing hooks to carefully implement a paranoid pattern', async () => {
    await pet.destroy()
    const reloadedPet = await Pet.removeAllDefaultScopes().find(pet.id)
    expect(reloadedPet!.deletedAt).not.toBeNull()
    expect(reloadedPet).toMatchDreamModel(pet)
  })
})
