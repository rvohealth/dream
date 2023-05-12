import User from '../../../test-app/app/models/User'
import Pet from '../../../test-app/app/models/Pet'
import { IdType } from '../../../src'

describe('Dream#cancel', () => {
  let user: User
  let pet: Pet
  let petId: IdType | null = null
  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    pet = await Pet.create({ user })
    petId = pet.id
  })

  it('cancels the deleting of a record, allowing hooks to carefully implement a paranoid pattern', async () => {
    await pet.destroy()
    const reloadedPet = await Pet.unscoped().find(petId)
    expect(reloadedPet!.deleted_at).not.toBeNull()
    expect(reloadedPet).toMatchDreamModel(pet)
  })
})
