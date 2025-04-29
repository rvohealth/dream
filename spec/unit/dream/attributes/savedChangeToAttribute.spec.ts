import { UpdateableProperties } from '../../../../src/index.js'
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

    context('datatypes', () => {
      const defaultAttrs: UpdateableProperties<ModelForOpenapiTypeSpecs> = {
        email: 'a@a',
        passwordDigest: 'abc',
      }

      context('json', () => {
        it.only('returns the values from the most recent save', async () => {
          let record = await ModelForOpenapiTypeSpecs.create({
            ...defaultAttrs,
          })
          record = (await ModelForOpenapiTypeSpecs.find(record.id))!
          expect(record.savedChangeToAttribute('jsonData')).toEqual(false)

          console.log('BEFORE UPDATE')
          await record.update({ jsonData: { hello: 'world' } })
          expect(record.savedChangeToAttribute('jsonData')).toEqual(true)

          await record.update({ jsonData: { goodbye: 'world' } })
          expect(record.savedChangeToAttribute('jsonData')).toEqual(true)

          await record.update({ email: 'b@b' })
          expect(record.savedChangeToAttribute('species')).toEqual(false)
        })
      })
    })
  })
})
