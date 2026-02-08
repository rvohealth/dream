import { DateTime } from '../../../../../src/helpers/DateTime.js'
import ModelForDatabaseTypeSpec from '../../../../../test-app/app/models/ModelForDatabaseTypeSpec.js'

describe('datetime', () => {
  it('can be saved to and restored from the database, maintaining microseconds', async () => {
    const isoString = '2026-02-07T21:45:07.001234Z'
    const datetime = DateTime.fromISO(isoString)
    const model = await ModelForDatabaseTypeSpec.create({ myDatetime: datetime })
    expect(model.myDatetime.toISO()).toEqual(isoString)

    const reloadedModel = await ModelForDatabaseTypeSpec.findOrFail(model.id)
    expect(reloadedModel.myDatetime).toEqualDateTime(datetime)
    expect(reloadedModel.myDatetime.toISO()).toEqual(isoString)
  })

  it('ISO datetime can be saved to and restored from the database, maintaining microseconds', async () => {
    const isoString = '2026-02-07T21:45:07.001234Z'
    const model = await ModelForDatabaseTypeSpec.create({ myDatetime: isoString as unknown as DateTime })
    expect(model.myDatetime.toISO()).toEqual(isoString)

    const reloadedModel = await ModelForDatabaseTypeSpec.findOrFail(model.id)
    expect(reloadedModel.myDatetime.toISO()).toEqual(isoString)
  })
})
