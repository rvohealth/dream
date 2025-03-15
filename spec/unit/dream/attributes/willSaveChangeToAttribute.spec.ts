import Pet from '../../../../test-app/app/models/Pet.js'

describe('Dream#willSaveChangeToAttribute', () => {
  context('with a newly-created record', () => {
    it('returns the values from the most recent save', async () => {
      const pet = Pet.new({ species: 'cat' })
      expect(pet.willSaveChangeToAttribute('species')).toEqual(true)

      await pet.save()
      expect(pet.willSaveChangeToAttribute('species')).toEqual(false)

      pet.species = 'dog'
      expect(pet.willSaveChangeToAttribute('species')).toEqual(true)
    })
  })

  context('with an existing record', () => {
    it('returns the values from the most recent save', async () => {
      let pet = await Pet.create({ species: 'cat' })
      pet = (await Pet.find(pet.id))!
      expect(pet.willSaveChangeToAttribute('species')).toEqual(false)

      pet.species = 'dog'
      expect(pet.willSaveChangeToAttribute('species')).toEqual(true)

      await pet.save()
      expect(pet.willSaveChangeToAttribute('species')).toEqual(false)
    })
  })
})
