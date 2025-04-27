import { DreamApp } from '../../../src/index.js'
import Pet from '../../../test-app/app/models/Pet.js'

describe('setting a text field', () => {
  context('default form (NFC)', () => {
    it('automatically normalizes unicode when saving', async () => {
      const decomposedString = '\u006E\u0303' // ñ
      const composedString = '\u00F1' // ñ
      const pet = await Pet.create({ name: decomposedString })

      const foundPet = await Pet.findOrFailBy({ name: composedString })

      expect(foundPet).toMatchDreamModel(pet)
      expect(foundPet.name).toEqual(composedString)
    })

    it('automatically normalizes unicode when querying', async () => {
      const decomposedString = '\u006E\u0303' // ñ
      const composedString = '\u00F1' // ñ
      const pet = await Pet.create({ name: composedString })

      const foundPet = await Pet.findOrFailBy({ name: decomposedString })

      expect(foundPet).toMatchDreamModel(pet)
    })

    it('automatically normalizes unicode when querying with an array', async () => {
      const decomposedString = '\u006E\u0303' // ñ
      const composedString = '\u00F1' // ñ
      const pet = await Pet.create({ name: composedString })

      const foundPet = await Pet.findOrFailBy({ name: [decomposedString] })

      expect(foundPet).toMatchDreamModel(pet)
    })
  })

  context('default form (NFD)', () => {
    beforeEach(() => {
      vi.spyOn(DreamApp.getOrFail(), 'unicodeNormalization', 'get').mockReturnValue('NFD')
    })

    it('automatically normalizes unicode when saving', async () => {
      const decomposedString = '\u006E\u0303' // ñ
      const composedString = '\u00F1' // ñ
      const pet = await Pet.create({ name: composedString })

      const foundPet = await Pet.findOrFailBy({ name: decomposedString })

      expect(foundPet).toMatchDreamModel(pet)
      expect(foundPet.name).toEqual(decomposedString)
    })

    it('automatically normalizes unicode when querying', async () => {
      const decomposedString = '\u006E\u0303' // ñ
      const composedString = '\u00F1' // ñ
      const pet = await Pet.create({ name: decomposedString })

      const foundPet = await Pet.findOrFailBy({ name: composedString })

      expect(foundPet).toMatchDreamModel(pet)
    })

    it('automatically normalizes unicode when querying with an array', async () => {
      const decomposedString = '\u006E\u0303' // ñ
      const composedString = '\u00F1' // ñ
      const pet = await Pet.create({ name: decomposedString })

      const foundPet = await Pet.findOrFailBy({ name: [composedString] })

      expect(foundPet).toMatchDreamModel(pet)
    })
  })

  context('none (normalization disabled)', () => {
    beforeEach(() => {
      vi.spyOn(DreamApp.getOrFail(), 'unicodeNormalization', 'get').mockReturnValue('none')
    })

    it('does not normalize unicode when saving', async () => {
      const decomposedString = '\u006E\u0303' // ñ
      const composedString = '\u00F1' // ñ
      const pet = await Pet.create({ name: decomposedString })

      const foundPet = await Pet.findOrFailBy({ name: decomposedString })

      expect(foundPet).toMatchDreamModel(pet)
      expect(foundPet.name).toEqual(decomposedString)
      expect(await Pet.findBy({ name: composedString })).toBeNull()
    })

    it('does not normalize unicode when querying', async () => {
      const decomposedString = '\u006E\u0303' // ñ
      const composedString = '\u00F1' // ñ
      await Pet.create({ name: composedString })

      expect(await Pet.findBy({ name: decomposedString })).toBeNull()
    })

    it('does not normalize unicode when querying with an array', async () => {
      const decomposedString = '\u006E\u0303' // ñ
      const composedString = '\u00F1' // ñ
      await Pet.create({ name: composedString })

      expect(await Pet.findBy({ name: [decomposedString] })).toBeNull()
    })
  })
})
