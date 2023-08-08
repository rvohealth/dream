import Pet from '../../../../test-app/app/models/Pet'
import User from '../../../../test-app/app/models/User'

describe('Dream#changes', () => {
  it('returns the values from the most recent save', async () => {
    const pet = Pet.new({ species: 'dog' })
    expect(pet.changes()).toEqual({
      species: {
        was: undefined,
        now: 'dog',
      },
    })

    await pet.save()
    expect(pet.changes()).toEqual(
      expect.objectContaining({
        species: {
          was: undefined,
          now: 'dog',
        },
      })
    )

    pet.species = 'cat'
    pet.species = 'frog'
    expect(pet.changes()).toEqual(
      expect.objectContaining({
        species: {
          was: 'dog',
          now: 'frog',
        },
      })
    )

    await pet.save()
    expect(pet.changes()).toEqual(
      expect.objectContaining({
        species: {
          was: 'dog',
          now: 'frog',
        },
      })
    )
  })
})
