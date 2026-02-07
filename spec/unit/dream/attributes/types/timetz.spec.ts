import ClockTimeTz from '../../../../../src/utils/datetime/ClockTimeTz.js'
import User from '../../../../../test-app/app/models/User.js'

describe('marshalling postgres time with timezone from db', () => {
  const userOptions = { password: 'howyadoin' }

  it('converts to a ClockTimeTz after round-trip, converted to UTC', async () => {
    const wakeUpTime = ClockTimeTz.fromISO('08:30:45.123456-05:00')

    const user = await User.create({ ...userOptions, email: `fred-${Date.now()}@example.com`, wakeUpTime })
    const reloadedUser = await User.find(user.id)

    expect(reloadedUser!.wakeUpTime).toBeInstanceOf(ClockTimeTz)
    expect(reloadedUser!.wakeUpTime?.toISOTime()).toEqual('13:30:45.123456Z')
  })

  it('handles different timezones correctly', async () => {
    const nonce = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
    const utcTime = ClockTimeTz.fromISO('06:00:00Z')
    const user1 = await User.create({
      ...userOptions,
      email: `user1-${nonce}@example.com`,
      wakeUpTime: utcTime,
    })

    const pstTime = ClockTimeTz.fromISO('06:00:00-08:00')
    const user2 = await User.create({
      ...userOptions,
      email: `user2-${nonce}@example.com`,
      wakeUpTime: pstTime,
    })

    const reloadedUser1 = await User.find(user1.id)
    const reloadedUser2 = await User.find(user2.id)

    expect(reloadedUser1!.wakeUpTime!.toISOTime()).toEqual('06:00:00.000000Z')
    expect(reloadedUser2!.wakeUpTime!.toISOTime()).toEqual('14:00:00.000000Z')
  })

  it('handles microseconds with timezone', async () => {
    const nonce = Date.now()
    const time = ClockTimeTz.fromISO('09:15:30.789123+03:00')

    const user = await User.create({ ...userOptions, email: `micros-${nonce}@example.com`, wakeUpTime: time })
    const reloadedUser = await User.find(user.id)

    expect(reloadedUser!.wakeUpTime!.millisecond).toEqual(789)
    expect(reloadedUser!.wakeUpTime!.microsecond).toEqual(123)
    expect(reloadedUser!.wakeUpTime!.toISOTime()).toEqual('06:15:30.789123Z')
  })

  context('when time value is set to null', () => {
    it('is null', async () => {
      const user = await User.create({
        ...userOptions,
        email: `null-${Date.now()}@example.com`,
        wakeUpTime: null,
      })
      const reloadedUser = await User.find(user.id)
      expect(reloadedUser!.wakeUpTime).toEqual(null)
    })
  })

  context('when time value is set to undefined', () => {
    it('is null', async () => {
      const user = await User.create({
        ...userOptions,
        email: `undefined-${Date.now()}@example.com`,
        wakeUpTime: undefined as any,
      })
      const reloadedUser = await User.find(user.id)
      expect(reloadedUser!.wakeUpTime).toEqual(null)
    })
  })
})
