import { ValidationError } from '../../../../src/index.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import User from '../../../../test-app/app/models/User.js'

describe('associated BelongsTo models', () => {
  it('are required', async () => {
    await User.create({ email: 'fred@frewd', password: 'howadoin' })
    const composition = Composition.new({ content: 'Aster is the Flufflord: a philosophic approach' })

    await expect(composition.save()).rejects.toThrow(ValidationError)

    expect(composition.errors).toMatchObject({ user: ['requiredBelongsTo'] })
  })

  context('when optional', () => {
    it('are not required', async () => {
      const pet = Pet.new({ name: 'Aster' })
      await pet.save()
      const reloadedPet = await Pet.find(pet.id)
      expect(reloadedPet!.name).toEqual('Aster')
    })
  })
})
