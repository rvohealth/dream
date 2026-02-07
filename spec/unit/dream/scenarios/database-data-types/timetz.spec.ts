import { ClockTimeTz } from '../../../../../src/package-exports/index.js'
import ModelForDatabaseTypeSpec from '../../../../../test-app/app/models/ModelForDatabaseTypeSpec.js'

describe('time with time zone (timetz)', () => {
  it('times without a timezone are preserved going into and coming out of the database', async () => {
    const isoTime = '21:45:07.001234'
    const clockTime = ClockTimeTz.fromISO(isoTime)
    const model = await ModelForDatabaseTypeSpec.create({ myTimeWithZone: clockTime })

    const reloaded = await ModelForDatabaseTypeSpec.findOrFail(model.id)
    expect(reloaded.myTimeWithZone?.toDateTime().offset).toEqual(0)
    expect(reloaded.myTimeWithZone?.toISOTime()).toEqual(isoTime + 'Z')
  })

  it('UTC times are preserved going into and coming out of the database', async () => {
    const isoTime = '21:45:07.001234Z'
    const clockTime = ClockTimeTz.fromISO(isoTime)
    const model = await ModelForDatabaseTypeSpec.create({ myTimeWithZone: clockTime })

    const reloaded = await ModelForDatabaseTypeSpec.findOrFail(model.id)
    expect(reloaded.myTimeWithZone?.toDateTime().offset).toEqual(0)
    expect(reloaded.myTimeWithZone?.toISOTime()).toEqual(isoTime)
  })

  it('non-UTC times are converted to UTC going into and coming out of the database', async () => {
    const isoTime = '16:45:07.001234-06:00'
    const time = ClockTimeTz.fromISO(isoTime)
    const model = await ModelForDatabaseTypeSpec.create({ myTimeWithZone: time })

    const reloaded = await ModelForDatabaseTypeSpec.findOrFail(model.id)
    expect(reloaded.myTimeWithZone?.toDateTime().offset).toEqual(0)
    expect(reloaded.myTimeWithZone?.toISOTime()).toEqual('22:45:07.001234Z')
    expect(reloaded.myTimeWithZone?.setZone('America/Chicago').toISOTime()).toEqual(isoTime)
  })
})
