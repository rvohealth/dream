import Pet from '../../../../test-app/app/models/Pet'

describe('Dream#savedChangeToAttribute', () => {
  context('with a newly-created record', () => {
    it('returns the values from the most recent save', async () => {
      const pet = Pet.new({ species: 'cat' })
      expect(pet.savedChangeToAttribute('species')).toEqual(false)

      await pet.save()
      expect(pet.savedChangeToAttribute('species')).toEqual(true)

      await pet.update({ name: 'my little pony' })
      expect(pet.savedChangeToAttribute('species')).toEqual(false)
    })
  })

  context('with an existing record', () => {
    it('returns the values from the most recent save', async () => {
      let pet = await Pet.create({ species: 'cat' })
      pet = (await Pet.find(pet.id))!
      expect(pet.savedChangeToAttribute('species')).toEqual(false)

      await pet.update({ species: 'dog' })
      expect(pet.savedChangeToAttribute('species')).toEqual(true)

      await pet.update({ name: 'my little pony' })
      expect(pet.savedChangeToAttribute('species')).toEqual(false)
    })
  })
})
