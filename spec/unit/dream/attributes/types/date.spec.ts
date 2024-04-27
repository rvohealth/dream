import { DateTime } from 'luxon'
import User from '../../../../../test-app/app/models/User'

describe('marshalling postgres dates from db', () => {
  const userOptions = { email: 'fred@', password: 'howyadoin' }

  it('converts to a UTC DateTime with the date part identical to the specified DateTime', async () => {
    const date = DateTime.fromISO('2023-10-18T00:00:00')

    const user = await User.create({ ...userOptions, birthdate: date })
    const reloadedUser = await User.find(user.id)
    expect(reloadedUser!.birthdate!.toISODate()).toEqual('2023-10-18')
    expect(reloadedUser!.birthdate!.zoneName).toEqual('UTC')
  })

  context('when date value is set to null', () => {
    it('is null', async () => {
      const user = await User.create({ ...userOptions, birthdate: null })
      const reloadedUser = await User.find(user.id)
      expect(reloadedUser!.birthdate).toEqual(null)
    })
  })

  context('when date value is set to undefined', () => {
    it('is null', async () => {
      const user = await User.create({ ...userOptions, birthdate: undefined })
      const reloadedUser = await User.find(user.id)
      expect(reloadedUser!.birthdate).toEqual(null)
    })
  })
})
