import { UpdateableProperties } from '../../../../src/types/dream.js'
import ModelForOpenapiTypeSpecs from '../../../../test-app/app/models/ModelForOpenapiTypeSpec.js'
import Pet from '../../../../test-app/app/models/Pet.js'

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

    it('returns true for a nullable column the create left unassigned, which the insert returned as null', async () => {
      const pet = await Pet.create({ species: 'cat' })
      expect(pet.name).toBeNull()
      expect(pet.savedChangeToAttribute('name')).toEqual(true)
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

    it('returns false for a column with an unsaved change on a record that has not been saved since it was loaded', async () => {
      const { id } = await Pet.create({ species: 'cat' })
      const pet = await Pet.findOrFail(id)

      pet.species = 'dog'
      expect(pet.savedChangeToAttribute('species')).toEqual(false)
    })

    it('returns false for a column the most recent save did not change, while an unsaved change to it is pending', async () => {
      const { id } = await Pet.create({ species: 'cat' })
      const pet = await Pet.findOrFail(id)
      await pet.update({ name: 'my little pony' })

      pet.species = 'dog'
      expect(pet.savedChangeToAttribute('species')).toEqual(false)
    })

    it('keeps returning true for a column the most recent save changed after a later unsaved edit to it', async () => {
      const { id } = await Pet.create({ species: 'cat' })
      const pet = await Pet.findOrFail(id)
      await pet.update({ species: 'dog' })

      pet.species = 'frog'
      expect(pet.savedChangeToAttribute('species')).toEqual(true)

      pet.species = 'cat'
      expect(pet.savedChangeToAttribute('species')).toEqual(true)
    })
  })

  context('datatypes', () => {
    const defaultAttrs: UpdateableProperties<ModelForOpenapiTypeSpecs> = {
      email: 'a@a',
      passwordDigest: 'abc',
    }

    context('json', () => {
      it('returns the values from the most recent save', async () => {
        let record = await ModelForOpenapiTypeSpecs.create({
          ...defaultAttrs,
        })
        record = (await ModelForOpenapiTypeSpecs.find(record.id))!
        expect(record.savedChangeToAttribute('jsonData')).toEqual(false)

        await record.update({ jsonData: { hello: 'world' } })
        expect(record.savedChangeToAttribute('jsonData')).toEqual(true)

        await record.update({ jsonData: { goodbye: 'world' } })
        expect(record.savedChangeToAttribute('jsonData')).toEqual(true)

        await record.update({ email: 'b@b' })
        expect(record.savedChangeToAttribute('jsonData')).toEqual(false)
      })
    })
  })
})
