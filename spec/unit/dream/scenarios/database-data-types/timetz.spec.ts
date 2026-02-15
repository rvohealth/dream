import ClockTime from '../../../../../src/utils/datetime/ClockTime.js'
import ModelForDatabaseTypeSpec from '../../../../../test-app/app/models/ModelForDatabaseTypeSpec.js'

describe('time with time zone (timetz)', () => {
  it('times without a timezone are preserved going into and coming out of the database', async () => {
    const isoTime = '21:45:07.001234'
    const clockTime = ClockTime.fromISO(isoTime)
    const model = await ModelForDatabaseTypeSpec.create({ myTimeWithZone: clockTime })

    const reloaded = await ModelForDatabaseTypeSpec.findOrFail(model.id)
    expect(reloaded.myTimeWithZone?.toDateTime().offset).toEqual(0)
    expect(reloaded.myTimeWithZone?.toISOTime()).toEqual(isoTime)
  })

  it('UTC times are preserved going into and coming out of the database', async () => {
    const isoTime = '21:45:07.001234Z'
    const clockTime = ClockTime.fromISO(isoTime)
    const model = await ModelForDatabaseTypeSpec.create({ myTimeWithZone: clockTime })

    const reloaded = await ModelForDatabaseTypeSpec.findOrFail(model.id)
    expect(reloaded.myTimeWithZone?.toDateTime().offset).toEqual(0)
    expect(reloaded.myTimeWithZone?.toISOTime({ includeOffset: true })).toEqual(isoTime)
  })

  it('non-UTC times are converted to UTC going into and coming out of the database', async () => {
    const isoTime = '16:45:07.001234-06:00'
    const time = ClockTime.fromISO(isoTime)
    const model = await ModelForDatabaseTypeSpec.create({ myTimeWithZone: time })

    const reloaded = await ModelForDatabaseTypeSpec.findOrFail(model.id)
    expect(reloaded.myTimeWithZone?.toDateTime().offset).toEqual(0)
    expect(reloaded.myTimeWithZone?.toISOTime()).toEqual('22:45:07.001234')
    expect(reloaded.myTimeWithZone?.setZone('America/Chicago').toISOTime({ includeOffset: true })).toEqual(
      isoTime
    )
  })
})
