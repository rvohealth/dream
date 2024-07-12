import User from '../../../test-app/app/models/User'
import Pet from '../../../test-app/app/models/Pet'
import { IdType } from '../../../src/dream/types'

describe('Dream#removeAllDefaultScopes', () => {
  let user: User
  let pet: Pet
  let petId: IdType
  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    pet = await Pet.create({ user })
    petId = pet.id
  })

  it('returns an query with no default scopes applied', async () => {
    await pet.destroy()
    const reloadedPet = await Pet.removeAllDefaultScopes().find(petId)
    expect(reloadedPet!.deletedAt).not.toBeNull()
    expect(reloadedPet).toMatchDreamModel(pet)
  })
})
