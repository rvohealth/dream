import ColumnOverflow from '../../../../src/errors/db/ColumnOverflow.js'
import { unpersistedFleshedOutModelForOpenapiTypeSpecs } from '../../../scaffold/fleshedOutModelForOpenapiTypeSpecs.js'

describe('saving too long data into a column', () => {
  context('string', () => {
    it('throws ColumnOverflow', async () => {
      const model = unpersistedFleshedOutModelForOpenapiTypeSpecs()
      model.name = 'a'.repeat(129)

      await expect(model.save()).rejects.toThrow(ColumnOverflow)
    })
  })

  context('decimal', () => {
    it('throws ColumnOverflow', async () => {
      const model = unpersistedFleshedOutModelForOpenapiTypeSpecs()
      model.volume = 99999999

      await expect(model.save()).rejects.toThrow(ColumnOverflow)
    })
  })

  context('small integer', () => {
    it('throws ColumnOverflow', async () => {
      const model = unpersistedFleshedOutModelForOpenapiTypeSpecs()
      model.aSmallInteger = 99999999

      await expect(model.save()).rejects.toThrow(ColumnOverflow)
    })
  })

  context('integer', () => {
    it('throws ColumnOverflow', async () => {
      const model = unpersistedFleshedOutModelForOpenapiTypeSpecs()

      await expect(model.update({ anInteger: '999999999999999' as unknown as number })).rejects.toThrow(
        ColumnOverflow
      )
    })
  })
})
