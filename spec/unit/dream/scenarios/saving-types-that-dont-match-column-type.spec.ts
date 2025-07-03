import DataTypeColumnTypeMismatch from '../../../../src/errors/db/DataTypeColumnTypeMismatch.js'
import { CalendarDate, DateTime } from '../../../../src/index.js'
import { SpeciesTypesEnum } from '../../../../test-app/types/db.js'
import { unpersistedFleshedOutModelForOpenapiTypeSpecs } from '../../../scaffold/fleshedOutModelForOpenapiTypeSpecs.js'

describe('saving types that don’t match the database column', () => {
  context('saving non-integer to integer', () => {
    it('throws DataTypeColumnTypeMismatch', async () => {
      const model = unpersistedFleshedOutModelForOpenapiTypeSpecs()
      model.collarCountInt = 'hello' as any as number

      await expect(model.save()).rejects.toThrow(DataTypeColumnTypeMismatch)
    })
  })

  context('saving non-bigint to bigint', () => {
    it('throws DataTypeColumnTypeMismatch', async () => {
      const model = unpersistedFleshedOutModelForOpenapiTypeSpecs()
      model.favoriteBigint = 'hello'

      await expect(model.save()).rejects.toThrow(DataTypeColumnTypeMismatch)
    })
  })

  context('saving non-date to date', () => {
    it('throws DataTypeColumnTypeMismatch', async () => {
      const model = unpersistedFleshedOutModelForOpenapiTypeSpecs()
      model.birthdate = 'hello' as any as CalendarDate

      await expect(model.save()).rejects.toThrow(DataTypeColumnTypeMismatch)
    })
  })

  context('saving non-datetime to datetime', () => {
    it('throws DataTypeColumnTypeMismatch', async () => {
      const model = unpersistedFleshedOutModelForOpenapiTypeSpecs()
      model.aDatetime = 'hello' as any as DateTime

      await expect(model.save()).rejects.toThrow(DataTypeColumnTypeMismatch)
    })
  })

  context('saving non-enum to enum', () => {
    it('throws DataTypeColumnTypeMismatch', async () => {
      const model = unpersistedFleshedOutModelForOpenapiTypeSpecs()
      model.species = 'hello' as any as SpeciesTypesEnum

      await expect(model.save()).rejects.toThrow(DataTypeColumnTypeMismatch)
    })
  })
})
