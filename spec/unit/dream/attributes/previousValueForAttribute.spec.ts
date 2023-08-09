import Pet from '../../../../test-app/app/models/Pet'
import User from '../../../../test-app/app/models/User'

describe('Dream#previousValueForAttribute', () => {
  context('with a newly-created record', () => {
    it('returns the values from the most recent save', async () => {
      const pet = Pet.new({ species: 'cat' })
      expect(pet.previousValueForAttribute('species')).toEqual(undefined)

      await pet.save()
      expect(pet.previousValueForAttribute('species')).toEqual(undefined)

      pet.species = 'dog'
      expect(pet.previousValueForAttribute('species')).toEqual(undefined)

      await pet.save()
      expect(pet.previousValueForAttribute('species')).toEqual('cat')

      await pet.update({ species: 'cat' })
      expect(pet.previousValueForAttribute('species')).toEqual('dog')
    })
  })

  context('with a record loaded from the db', () => {
    it('returns the values from the most recent save', async () => {
      let pet = await Pet.create({ species: 'cat' })
      pet = (await Pet.find(pet.id))!
      pet.species = 'dog'
      expect(pet.previousValueForAttribute('species')).toEqual('cat')

      await pet.save()
      expect(pet.previousValueForAttribute('species')).toEqual('cat')

      await pet.update({ species: 'cat' })
      expect(pet.previousValueForAttribute('species')).toEqual('dog')
    })
  })
})
