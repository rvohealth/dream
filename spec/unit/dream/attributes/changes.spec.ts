import { DateTime } from '../../../../src/helpers/DateTime.js'
import ModelForOpenapiTypeSpecs from '../../../../test-app/app/models/ModelForOpenapiTypeSpec.js'
import Pet from '../../../../test-app/app/models/Pet.js'

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
        species: {
          was: 'dog',
          now: 'frog',
        },
      })
    })

    it("datetimes that don't change are not included", async () => {
      await pet.update({ name: 'Snoopy' })

      expect(pet.changes()).toEqual({
        name: { was: null, now: 'Snoopy' },
      })
    })

    it('datetimes that are changed are included', () => {
      const originalCreatedAt = pet.createdAt
      const otherDatetime = DateTime.now().minus({ minutes: 1 })
      pet.createdAt = otherDatetime
      expect(pet.changes()).toEqual({
        createdAt: {
          was: originalCreatedAt,
          now: otherDatetime,
        },
      })
    })
  })

  context('jsonb fields', () => {
    it('correctly diffs jsonb fields', async () => {
      const model = await ModelForOpenapiTypeSpecs.create({
        email: 'h@h',
        passwordDigest: 'abc',
        jsonData: { howyadoin: true },
      })

      const reloaded = await ModelForOpenapiTypeSpecs.findOrFail(model.id)
      expect(reloaded.changes()).toEqual({})

      reloaded.jsonData = { howyadoin: false }
      expect(reloaded.changes()).toEqual({
        jsonData: {
          was: '{"howyadoin":true}',
          now: '{"howyadoin":false}',
        },
      })
    })
  })
})
