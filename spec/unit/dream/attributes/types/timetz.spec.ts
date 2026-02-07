import ClockTime from '../../../../../src/utils/datetime/ClockTime.js'
import User from '../../../../../test-app/app/models/User.js'

describe('marshalling postgres time with timezone from db', () => {
  const userOptions = { password: 'howyadoin' }

  it('converts to a UTC ClockTime after round-trip', async () => {
    const wakeUpTime = ClockTime.fromISO('08:30:45.123456-05:00')

    const user = await User.create({ ...userOptions, email: `fred-${Date.now()}@example.com`, wakeUpTime })
    const reloadedUser = await User.find(user.id)

    expect(reloadedUser!.wakeUpTime).toBeInstanceOf(ClockTime)
    expect(reloadedUser!.wakeUpTime?.toDateTime().offset).toBe(0)
    expect(reloadedUser!.wakeUpTime?.toISOTime()).toBe('13:30:45.123456')
  })

  it('handles different timezones correctly', async () => {
    const nonce = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
    const utcTime = ClockTime.fromISO('06:00:00Z')
    const user1 = await User.create({
      ...userOptions,
      email: `user1-${nonce}@example.com`,
      wakeUpTime: utcTime,
    })

    const pstTime = ClockTime.fromISO('06:00:00-08:00')
    const user2 = await User.create({
      ...userOptions,
      email: `user2-${nonce}@example.com`,
      wakeUpTime: pstTime,
    })

    const reloadedUser1 = await User.find(user1.id)
    const reloadedUser2 = await User.find(user2.id)

    expect(reloadedUser1!.wakeUpTime!.toDateTime().offset).toBe(0)
    expect(reloadedUser2!.wakeUpTime!.toDateTime().offset).toBe(0)
    expect(reloadedUser1!.wakeUpTime!.toISOTime()).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{6}$/)
    expect(reloadedUser2!.wakeUpTime!.toISOTime()).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{6}$/)
  })

  it('handles microseconds with timezone', async () => {
    const nonce = Date.now()
    const time = ClockTime.fromISO('09:15:30.789123+03:00')

    const user = await User.create({ ...userOptions, email: `micros-${nonce}@example.com`, wakeUpTime: time })
    const reloadedUser = await User.find(user.id)

    expect(reloadedUser!.wakeUpTime!.millisecond).toEqual(789)
    expect(reloadedUser!.wakeUpTime!.microsecond).toEqual(123)
    expect(reloadedUser!.wakeUpTime!.toISOTime()).toBe('06:15:30.789123')
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

  it('serialization uses time-only output without timezone offset', () => {
    const time = ClockTime.fromISO('10:30:00.000000+05:30')

    expect(time.toISOTime()).toBe('10:30:00.000000')
    expect(time.toJSON()).toBe('10:30:00.000000')
  })
})
