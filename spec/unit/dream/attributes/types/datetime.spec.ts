import { DateTime } from 'luxon'
import Pet from '../../../../../test-app/app/models/Pet.js'

describe('marshalling postgres datetimes from db', () => {
  it('converts to a UTC DateTime with the date part identical to the specified DateTime', async () => {
    const datetime = DateTime.fromISO('2023-10-18T13:15:16')

    const user = await Pet.create({ deletedAt: datetime })
    const reloadedPet = await Pet.removeAllDefaultScopes().find(user.id)
    expect(reloadedPet!.deletedAt!.toISO()).toEqual(datetime.toUTC().toISO())
    expect(reloadedPet!.deletedAt!.zoneName).toEqual('UTC')
  })

  context('when date value is set to null', () => {
    it('is null', async () => {
      const user = await Pet.create({ deletedAt: null })
      const reloadedPet = await Pet.find(user.id)
      expect(reloadedPet!.deletedAt).toEqual(null)
    })
  })

  context('when date value is set to undefined', () => {
    it('is null', async () => {
      const user = await Pet.create({ deletedAt: undefined })
      const reloadedPet = await Pet.find(user.id)
      expect(reloadedPet!.deletedAt).toEqual(null)
    })
  })
})
