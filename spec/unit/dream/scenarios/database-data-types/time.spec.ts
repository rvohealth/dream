import ClockTime from '../../../../../src/utils/datetime/ClockTime.js'
import ModelForDatabaseTypeSpec from '../../../../../test-app/app/models/ModelForDatabaseTypeSpec.js'

describe('time without time zone (time)', () => {
  it('times without a timezone are preserved going into and coming out of the database', async () => {
    const isoTime = '21:45:07.001234'
    const time = ClockTime.fromISO(isoTime)
    const model = await ModelForDatabaseTypeSpec.create({ myTimeWithoutZone: time })

    const reloaded = await ModelForDatabaseTypeSpec.findOrFail(model.id)
    expect(reloaded.myTimeWithoutZone?.toDateTime().offset).toEqual(0)
    expect(reloaded.myTimeWithoutZone?.toISOTime()).toEqual(isoTime)
  })

  it('UTC times are preserved going into and coming out of the database', async () => {
    const isoTime = '21:45:07.001234Z'
    const time = ClockTime.fromISO(isoTime)
    const model = await ModelForDatabaseTypeSpec.create({ myTimeWithoutZone: time })

    const reloaded = await ModelForDatabaseTypeSpec.findOrFail(model.id)
    expect(reloaded.myTimeWithoutZone?.toDateTime().offset).toEqual(0)
    expect(reloaded.myTimeWithoutZone?.toISOTime()).toEqual('21:45:07.001234')
  })

  it('non-UTC times are normalized to UTC going into and coming out of the database', async () => {
    const isoTime = '21:45:07.001234-05:00'
    const time = ClockTime.fromISO(isoTime)
    const model = await ModelForDatabaseTypeSpec.create({ myTimeWithoutZone: time })

    const reloaded = await ModelForDatabaseTypeSpec.findOrFail(model.id)
    expect(reloaded.myTimeWithoutZone?.toDateTime().offset).toEqual(0)
    expect(reloaded.myTimeWithoutZone?.toISOTime()).toEqual('21:45:07.001234')
  })
})
