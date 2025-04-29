import ModelForOpenapiTypeSpecs from '../../../../test-app/app/models/ModelForOpenapiTypeSpec.js'
import Pet from '../../../../test-app/app/models/Pet.js'

describe('Dream#previousValueForAttribute', () => {
  context('with a newly-created record', () => {
    it('Returns the value most recently persisted to the database', async () => {
      const pet = Pet.new({ species: 'cat' })
      expect(pet.previousValueForAttribute('species')).toEqual(undefined)

      await pet.save()
      expect(pet.previousValueForAttribute('species')).toEqual(undefined)

      pet.species = 'dog'
      expect(pet.previousValueForAttribute('species')).toEqual('cat')

      await pet.save()
      expect(pet.previousValueForAttribute('species')).toEqual('cat')

      await pet.update({ species: 'cat' })
      expect(pet.previousValueForAttribute('species')).toEqual('dog')
    })
  })

  context('with a record loaded from the db', () => {
    it('Returns the value most recently persisted to the database', async () => {
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

  context('jsonb fields', () => {
    it('correctly diffs jsonb fields', async () => {
      const model = await ModelForOpenapiTypeSpecs.create({
        email: 'h@h',
        passwordDigest: 'abc',
        jsonData: { howyadoin: true },
      })
      expect(model.previousValueForAttribute('email')).toEqual(undefined)
      expect(model.previousValueForAttribute('jsonData')).toEqual(undefined)

      const reloaded = await ModelForOpenapiTypeSpecs.findOrFail(model.id)
      reloaded.jsonData = { howyadoin: false }
      expect(reloaded.previousValueForAttribute('jsonData')).toEqual({ howyadoin: true })

      await reloaded.save()

      const reloaded2 = await ModelForOpenapiTypeSpecs.findOrFail(reloaded.id)
      await reloaded2.update({ jsonData: { howyadoin: true }, email: 'b@b' })
      expect(reloaded2.previousValueForAttribute('jsonData')).toEqual({ howyadoin: false })
    })
  })
})
