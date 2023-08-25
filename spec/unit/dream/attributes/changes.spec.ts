import { DateTime } from 'luxon'
import Pet from '../../../../test-app/app/models/Pet'
import User from '../../../../test-app/app/models/User'

describe('Dream#changes', () => {
  context('with a newly-created record', () => {
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

      pet.species = 'frog'
      expect(pet.changes()).toEqual(
        expect.objectContaining({
          species: {
            was: undefined,
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

  context('with an existing record', () => {
    let pet: Pet
    beforeEach(async () => {
      pet = await Pet.create({ species: 'dog' })
      pet = (await Pet.find(pet.id))!
    })

    it('returns the values from the most recent save', async () => {
      expect(pet.changes()).toEqual({})

      pet.species = 'frog'
      expect(pet.changes()).toEqual({
        species: {
          was: 'dog',
          now: 'frog',
        },
      })

      await pet.save()
      expect(pet.changes()).toEqual({
        created_at: expect.objectContaining({ was: expect.any(DateTime), now: expect.any(DateTime) }),
        species: {
          was: 'dog',
          now: 'frog',
        },
      })
    })

    it("datetimes that don't change are not included", async () => {
      expect(pet.changes()).toEqual({})
    })

    it('datetimes that are changed are included', async () => {
      const originalCreatedAt = pet.created_at
      const otherDatetime = DateTime.now().minus({ minutes: 1 })
      pet.created_at = otherDatetime
      expect(pet.changes()).toEqual({
        created_at: {
          was: originalCreatedAt,
          now: otherDatetime,
        },
      })
    })
  })
})
