import Pet from '../../../../test-app/app/models/Pet'
import User from '../../../../test-app/app/models/User'

describe('Dream#previousValueForAttribute', () => {
  it('returns the values from the most recent save', async () => {
    const pet = Pet.new({ species: 'cat' })
    expect(pet.previousValueForAttribute('species')).toEqual(undefined)

    await pet.save()
    expect(pet.previousValueForAttribute('species')).toEqual(undefined)

    pet.species = 'dog'
    pet.species = 'frog'
    expect(pet.previousValueForAttribute('species')).toEqual('cat')

    await pet.save()
    expect(pet.previousValueForAttribute('species')).toEqual('cat')

    pet.species = 'cat'
    expect(pet.previousValueForAttribute('species')).toEqual('frog')
  })
})
