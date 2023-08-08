import Pet from '../../../../test-app/app/models/Pet'
import User from '../../../../test-app/app/models/User'

describe('Dream#savedChangeToAttribute', () => {
  it('returns the values from the most recent save', async () => {
    const pet = Pet.new({ species: 'cat' })
    expect(pet.savedChangeToAttribute('species')).toEqual(false)

    await pet.save()
    expect(pet.savedChangeToAttribute('species')).toEqual(true)

    await pet.update({ name: 'my little pony' })
    expect(pet.savedChangeToAttribute('species')).toEqual(false)
  })
})
