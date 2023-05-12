import User from '../../../test-app/app/models/User'
import Pet from '../../../test-app/app/models/Pet'
import { IdType } from '../../../src/sync/schema'

describe('Dream#unscoped', () => {
  let user: User
  let pet: Pet
  let petId: IdType | null = null
  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    pet = await Pet.create({ user })
    petId = pet.id
  })

  it('returns an unscoped query', async () => {
    await pet.destroy()
    const reloadedPet = await Pet.unscoped().find(petId)
    expect(reloadedPet!.deleted_at).not.toBeNull()
    expect(reloadedPet).toMatchDreamModel(pet)
  })
})
