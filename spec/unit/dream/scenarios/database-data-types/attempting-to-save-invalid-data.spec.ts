import { DataTypeColumnTypeMismatch } from '../../../../../src/package-exports/errors.js'
import { CalendarDate, ClockTime } from '../../../../../src/package-exports/index.js'
import ModelForDatabaseTypeSpec from '../../../../../test-app/app/models/ModelForDatabaseTypeSpec.js'

describe('attempting to save invalid data', () => {
  context('saving a date', () => {
    context('with a string that represents an valid date', () => {
      it('throws DataTypeColumnTypeMismatch', async () => {
        const isoDate = '2026-12-01'
        const model = await ModelForDatabaseTypeSpec.create()
        await model.update({ myDate: isoDate as unknown as CalendarDate })
        expect(model.myDate?.toISO()).toEqual(isoDate)
      })
    })

    context('with a string that represents an invalid date', () => {
      it('throws DataTypeColumnTypeMismatch', async () => {
        const model = await ModelForDatabaseTypeSpec.create()
        await expect(model.update({ myDate: '2026-13-01' as unknown as CalendarDate })).rejects.toThrow(
          DataTypeColumnTypeMismatch
        )
      })
    })

    context('with a number', () => {
      it('throws DataTypeColumnTypeMismatch', async () => {
        const model = await ModelForDatabaseTypeSpec.create()
        await expect(model.update({ myDate: 2026 as unknown as CalendarDate })).rejects.toThrow(
          DataTypeColumnTypeMismatch
        )
      })
    })
  })

  context('saving a time', () => {
    context('with a string that represents an valid time', () => {
      it('throws DataTypeColumnTypeMismatch', async () => {
        const isoTime = '23:00:00.123456'
        const model = await ModelForDatabaseTypeSpec.create()
        await model.update({ myTimeWithoutZone: isoTime as unknown as ClockTime })
        expect(model.myTimeWithoutZone?.toISO()).toEqual(isoTime)
      })
    })

    context('with a string that represents an invalid time', () => {
      it('throws DataTypeColumnTypeMismatch', async () => {
        const model = await ModelForDatabaseTypeSpec.create()
        await expect(model.update({ myTimeWithoutZone: '25:00:00' as unknown as ClockTime })).rejects.toThrow(
          DataTypeColumnTypeMismatch
        )
      })
    })

    context('with a number', () => {
      it('throws DataTypeColumnTypeMismatch', async () => {
        const model = await ModelForDatabaseTypeSpec.create()
        await expect(model.update({ myTimeWithoutZone: 100000 as unknown as ClockTime })).rejects.toThrow(
          DataTypeColumnTypeMismatch
        )
      })
    })
  })
})
