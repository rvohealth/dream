import ClockTime from '../../../../../src/utils/datetime/ClockTime.js'
import User from '../../../../../test-app/app/models/User.js'

describe('marshalling postgres time without timezone from db', () => {
  const userOptions = { email: 'fred@example.com', password: 'howyadoin' }

  it('converts to a ClockTime, preserving microseconds', async () => {
    const time = ClockTime.fromISO('22:30:45.123456')

    const user = await User.create({ ...userOptions, bedtime: time })
    const reloadedUser = await User.find(user.id)

    expect(reloadedUser!.bedtime).toBeInstanceOf(ClockTime)
    expect(reloadedUser!.bedtime!.hour).toEqual(22)
    expect(reloadedUser!.bedtime!.minute).toEqual(30)
    expect(reloadedUser!.bedtime!.second).toEqual(45)
    expect(reloadedUser!.bedtime!.millisecond).toEqual(123)
    expect(reloadedUser!.bedtime!.microsecond).toEqual(456)
  })

  context('when time value is set to null', () => {
    it('is null', async () => {
      const user = await User.create({ ...userOptions, bedtime: null })
      const reloadedUser = await User.find(user.id)
      expect(reloadedUser!.bedtime).toEqual(null)
    })
  })

  context('when time value is set to undefined', () => {
    it('is null', async () => {
      const user = await User.create({ ...userOptions, bedtime: undefined as any })
      const reloadedUser = await User.find(user.id)
      expect(reloadedUser!.bedtime).toEqual(null)
    })
  })
})
