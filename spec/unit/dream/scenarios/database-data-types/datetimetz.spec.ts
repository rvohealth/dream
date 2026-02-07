import { DateTime } from '../../../../../src/utils/datetime/DateTime.js'
import ModelForDatabaseTypeSpec from '../../../../../test-app/app/models/ModelForDatabaseTypeSpec.js'

describe('datetime with timezone (timestamptz)', () => {
  it('UTC datetimes are preserved going into and coming out of the database', async () => {
    const isoDatetime = '2024-03-02T10:30:45.123456Z'
    const dateTime = DateTime.fromISO(isoDatetime)
    const model = await ModelForDatabaseTypeSpec.create({ myDatetimeTz: dateTime })
    const reloaded = await ModelForDatabaseTypeSpec.findOrFail(model.id)
    expect(reloaded.myDatetimeTz?.toISO()).toEqual(isoDatetime)
  })

  it('non-UTC datetimes are converted to UTC going into and coming out of the database', async () => {
    const isoDatetime = '2024-03-02T10:30:45.123456-05:00'
    const dateTime = DateTime.fromISO(isoDatetime)
    const model = await ModelForDatabaseTypeSpec.create({ myDatetimeTz: dateTime })
    const reloaded = await ModelForDatabaseTypeSpec.findOrFail(model.id)
    expect(reloaded.myDatetimeTz?.toISO()).toEqual('2024-03-02T15:30:45.123456Z')
  })
})
