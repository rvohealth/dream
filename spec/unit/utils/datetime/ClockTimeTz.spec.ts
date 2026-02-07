import ClockTimeTz, { InvalidClockTimeTz } from '../../../../src/utils/datetime/ClockTimeTz.js'
import { DateTime } from '../../../../src/utils/datetime/DateTime.js'

describe('ClockTimeTz', () => {
  describe('.now', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-07T14:30:45.123Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('creates a ClockTimeTz for now in the system timezone', () => {
      const now = ClockTimeTz.now()
      const dtNow = DateTime.now()
      // ClockTimeTz always includes timezone, so we need to compare with includeOffset
      expect(now.toISOTime()).toEqual(dtNow.toISOTime({ includeOffset: true }))
    })
  })

  describe('.fromDateTime', () => {
    it('creates a ClockTimeTz from a DateTime instance', () => {
      const dateTime = DateTime.fromISO('2024-05-05T17:53:07.123456Z')
      const clockTime = ClockTimeTz.fromDateTime(dateTime)
      expect(clockTime.toISOTime()).toEqual('17:53:07.123456Z')
    })
  })

  describe('.fromJSDate', () => {
    it('creates a ClockTimeTz from a JavaScript Date', () => {
      const javascriptDate = new Date('2024-05-05T01:53:07.123Z')
      const clockTime = ClockTimeTz.fromJSDate(javascriptDate)
      expect(clockTime.hour).toEqual(1)
      expect(clockTime.minute).toEqual(53)
      expect(clockTime.second).toEqual(7)
    })

    describe('with a timezone', () => {
      it('creates a ClockTimeTz in the specified timezone', () => {
        const javascriptDate = new Date('2024-05-05T01:53:07.123Z')
        const clockTime = ClockTimeTz.fromJSDate(javascriptDate, { zone: 'America/Chicago' })
        // 01:53 UTC is 20:53 previous day in Chicago (CST is UTC-6, CDT is UTC-5)
        // May 5 is during DST, so it's CDT (UTC-5)
        expect(clockTime.hour).toEqual(20)
        expect(clockTime.minute).toEqual(53)
      })
    })

    context('with an invalid Date', () => {
      it('throws an error', () => {
        const invalidDate = new Date('invalid')
        expect(() => ClockTimeTz.fromJSDate(invalidDate)).toThrow(InvalidClockTimeTz)
      })
    })
  })

  describe('.fromISO', () => {
    it('creates a ClockTimeTz from an ISO string', () => {
      const clockTime = ClockTimeTz.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.hour).toEqual(10)
      expect(clockTime.minute).toEqual(30)
      expect(clockTime.second).toEqual(45)
      expect(clockTime.millisecond).toEqual(123)
      expect(clockTime.microsecond).toEqual(456)
    })

    context('with a time-only ISO string', () => {
      it('creates a ClockTimeTz', () => {
        const clockTime = ClockTimeTz.fromISO('10:30:45.123456')
        expect(clockTime.hour).toEqual(10)
        expect(clockTime.minute).toEqual(30)
        expect(clockTime.second).toEqual(45)
      })
    })

    context('with zone option', () => {
      it('interprets the time in the specified zone', () => {
        const clockTime = ClockTimeTz.fromISO('2024-03-02T10:30:45.123456Z', { zone: 'America/New_York' })
        // 10:30 UTC = 05:30 in New York (EST is UTC-5)
        expect(clockTime.hour).toEqual(5)
        expect(clockTime.minute).toEqual(30)
      })
    })

    context('with an invalid time string', () => {
      it('throws InvalidClockTimeTz', () => {
        expect(() => ClockTimeTz.fromISO('25:00:00')).toThrow(InvalidClockTimeTz)
      })
    })
  })

  describe('.fromSQL', () => {
    it('creates a ClockTimeTz from an SQL string', () => {
      const clockTime = ClockTimeTz.fromSQL('2024-03-02 10:30:45.123456')
      expect(clockTime.hour).toEqual(10)
      expect(clockTime.minute).toEqual(30)
      expect(clockTime.second).toEqual(45)
      expect(clockTime.second).toEqual(45)
      expect(clockTime.millisecond).toEqual(123)
      expect(clockTime.microsecond).toEqual(456)
    })

    context('with a time-only SQL string', () => {
      it('creates a ClockTimeTz', () => {
        const clockTime = ClockTimeTz.fromSQL('10:30:45.123456')
        expect(clockTime.hour).toEqual(10)
        expect(clockTime.minute).toEqual(30)
        expect(clockTime.second).toEqual(45)
        expect(clockTime.millisecond).toEqual(123)
        expect(clockTime.microsecond).toEqual(456)
      })
    })

    context('with an invalid time string', () => {
      it('throws InvalidClockTimeTz', () => {
        expect(() => ClockTimeTz.fromSQL('25:00:00')).toThrow(InvalidClockTimeTz)
      })
    })
  })

  describe('.fromFormat', () => {
    it('parses a time string with a format string', () => {
      const clockTime = ClockTimeTz.fromFormat('10:30:45', 'HH:mm:ss')
      expect(clockTime.hour).toEqual(10)
      expect(clockTime.minute).toEqual(30)
      expect(clockTime.second).toEqual(45)
    })

    it('parses fractional seconds with S token (milliseconds only)', () => {
      const clockTime = ClockTimeTz.fromFormat('10:30:45.123', 'HH:mm:ss.SSS')
      expect(clockTime.millisecond).toEqual(123)
      expect(clockTime.microsecond).toEqual(0)
    })

    it('parses 6-digit fractional seconds with microseconds using u token', () => {
      const clockTime = ClockTimeTz.fromFormat('10:30:45.123456', 'HH:mm:ss.u')
      expect(clockTime.millisecond).toEqual(123)
      expect(clockTime.microsecond).toEqual(456)
    })

    it('parses 6-digit fractional seconds with microseconds using SSSSSS token', () => {
      const clockTime = ClockTimeTz.fromFormat('10:30:45.123456', 'HH:mm:ss.SSSSSS')
      expect(clockTime.millisecond).toEqual(123)
      expect(clockTime.microsecond).toEqual(456)
    })

    it('pads short fractional parts when using u token', () => {
      const clockTime = ClockTimeTz.fromFormat('10:30:45.12', 'HH:mm:ss.u')
      expect(clockTime.millisecond).toEqual(120)
      expect(clockTime.microsecond).toEqual(0)
    })

    it('truncates long fractional parts when using u token', () => {
      const clockTime = ClockTimeTz.fromFormat('10:30:45.1234567890', 'HH:mm:ss.u')
      expect(clockTime.millisecond).toEqual(123)
      expect(clockTime.microsecond).toEqual(456)
    })

    it('parses a time with timezone', () => {
      const clockTime = ClockTimeTz.fromFormat('10:30:45 -05:00', 'HH:mm:ss ZZ')
      expect(clockTime.toISOTime()).toEqual('15:30:45.000000Z')
    })

    context('with zone option', () => {
      it('interprets the time in the specified zone', () => {
        const clockTime = ClockTimeTz.fromFormat('10:30:45 +00:00', 'HH:mm:ss ZZ', {
          zone: 'America/New_York',
        })
        expect(clockTime.toISOTime()).toEqual('05:30:45.000000-05:00')
      })
    })

    it('accepts locale option', () => {
      const clockTime = ClockTimeTz.fromFormat('10:30 PM', 'hh:mm a', { locale: 'en-US' })
      expect(clockTime.hour).toEqual(22)
      expect(clockTime.minute).toEqual(30)
    })

    it('throws InvalidClockTimeTz when format does not match', () => {
      expect(() => ClockTimeTz.fromFormat('not-matching', 'HH:mm:ss')).toThrow(InvalidClockTimeTz)
    })

    it('throws InvalidClockTimeTz when string is invalid for format', () => {
      expect(() => ClockTimeTz.fromFormat('25:99:99', 'HH:mm:ss')).toThrow(InvalidClockTimeTz)
    })
  })

  describe('.fromObject', () => {
    it('creates a ClockTimeTz from an object', () => {
      const clockTime = ClockTimeTz.fromObject({
        hour: 14,
        minute: 30,
        second: 45,
        millisecond: 123,
        microsecond: 456,
      })
      expect(clockTime.hour).toEqual(14)
      expect(clockTime.minute).toEqual(30)
      expect(clockTime.second).toEqual(45)
      expect(clockTime.millisecond).toEqual(123)
      expect(clockTime.microsecond).toEqual(456)
    })

    context('with zone option', () => {
      it('creates a ClockTimeTz in the specified zone', () => {
        const clockTime = ClockTimeTz.fromObject(
          { hour: 14, minute: 30, second: 45 },
          { zone: 'America/New_York' }
        )
        expect(clockTime.zoneName).toContain('America/New_York')
        expect(clockTime.hour).toEqual(14)
        expect(clockTime.minute).toEqual(30)
        expect(clockTime.second).toEqual(45)
      })
    })

    context('with an invalid time', () => {
      it('throws InvalidClockTimeTz for invalid hour', () => {
        expect(() => ClockTimeTz.fromObject({ hour: 25, minute: 0 })).toThrow(InvalidClockTimeTz)
      })

      it('throws InvalidClockTimeTz for invalid minute', () => {
        expect(() => ClockTimeTz.fromObject({ hour: 10, minute: 60 })).toThrow(InvalidClockTimeTz)
      })

      it('throws InvalidClockTimeTz for invalid second', () => {
        expect(() => ClockTimeTz.fromObject({ hour: 10, minute: 30, second: 60 })).toThrow(InvalidClockTimeTz)
      })

      it('throws InvalidClockTimeTz for invalid millisecond', () => {
        expect(() => ClockTimeTz.fromObject({ hour: 10, minute: 30, millisecond: 1000 })).toThrow(
          InvalidClockTimeTz
        )
      })

      it('throws InvalidClockTimeTz for negative hour', () => {
        expect(() => ClockTimeTz.fromObject({ hour: -1, minute: 0 })).toThrow(InvalidClockTimeTz)
      })

      it('throws InvalidClockTimeTz for negative minute', () => {
        expect(() => ClockTimeTz.fromObject({ hour: 10, minute: -1 })).toThrow(InvalidClockTimeTz)
      })
    })
  })

  describe('#toISOTime', () => {
    it('always includes timezone offset', () => {
      const clockTime = ClockTimeTz.fromObject({
        hour: 14,
        minute: 30,
        second: 45,
        millisecond: 123,
        microsecond: 456,
      })
      expect(clockTime.toISOTime()).toBe('14:30:45.123456Z')
    })

    it('includes timezone offset from different zones', () => {
      const clockTime = ClockTimeTz.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.toISOTime()).toBe('10:30:45.123456-05:00')
    })
  })

  describe('#toISO', () => {
    it('always includes timezone offset', () => {
      const clockTime = ClockTimeTz.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.toISO()).toBe('10:30:45.123456-05:00')
    })

    it('preserves timezone offset from input', () => {
      const clockTime = ClockTimeTz.fromISO('2024-03-02T10:30:45.123456+03:00')
      expect(clockTime.toISO()).toBe('10:30:45.123456+03:00')
    })
  })

  describe('#toSQL', () => {
    it('always includes timezone offset', () => {
      const clockTime = ClockTimeTz.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.toSQL()).toBe('10:30:45.123456 -05:00')
    })
  })

  describe('#toSQLTime', () => {
    it('always includes timezone offset', () => {
      const clockTime = ClockTimeTz.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.toSQLTime()).toBe('10:30:45.123456 -05:00')
    })
  })

  describe('#toJSON', () => {
    it('always includes timezone offset', () => {
      const clockTime = ClockTimeTz.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.toJSON()).toBe('10:30:45.123456-05:00')
    })
  })

  describe('#valueOf', () => {
    it('always includes timezone offset', () => {
      const clockTime = ClockTimeTz.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.valueOf()).toBe('10:30:45.123456-05:00')
    })
  })

  describe('#toLocaleString', () => {
    it('delegates to DateTime', () => {
      const clockTime = ClockTimeTz.fromObject({ hour: 14, minute: 30, second: 45 })
      expect(clockTime.toLocaleString({ hour: 'numeric', minute: '2-digit' })).toMatch(/14:30|2:30/)
    })
  })

  describe('#toString', () => {
    it('returns ISO format', () => {
      const clockTime = ClockTimeTz.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.toString()).toEqual(clockTime.toISO())
    })
  })

  describe('#toDateTime', () => {
    it('returns the underlying DateTime instance', () => {
      const dateTime = DateTime.fromISO('2024-03-02T10:30:45.123456-05:00')
      const clockTime = ClockTimeTz.fromDateTime(dateTime)
      expect(clockTime.toDateTime().toISO()).toEqual(dateTime.toISO())
    })
  })

  describe('#hour', () => {
    it('is the hour of the time', () => {
      const clockTime = ClockTimeTz.fromObject({ hour: 14, minute: 30 })
      expect(clockTime.hour).toEqual(14)
    })
  })

  describe('#minute', () => {
    it('is the minute of the time', () => {
      const clockTime = ClockTimeTz.fromObject({ hour: 14, minute: 30 })
      expect(clockTime.minute).toEqual(30)
    })
  })

  describe('#second', () => {
    it('is the second of the time', () => {
      const clockTime = ClockTimeTz.fromObject({ hour: 14, minute: 30, second: 45 })
      expect(clockTime.second).toEqual(45)
    })
  })

  describe('#millisecond', () => {
    it('is the millisecond of the time', () => {
      const clockTime = ClockTimeTz.fromObject({ hour: 14, minute: 30, second: 45, millisecond: 123 })
      expect(clockTime.millisecond).toEqual(123)
    })
  })

  describe('#microsecond', () => {
    it('is the microsecond of the time', () => {
      const clockTime = ClockTimeTz.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.microsecond).toEqual(456)
    })
  })

  describe('#zoneName', () => {
    it('returns the name of the timezone', () => {
      const clockTime = ClockTimeTz.fromObject({ hour: 14, minute: 30 }, { zone: 'America/New_York' })
      expect(clockTime.zoneName).toContain('America/New_York')
    })
  })

  describe('#offset', () => {
    it('returns the offset in minutes', () => {
      const clockTime = ClockTimeTz.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.offset).toEqual(-300) // -5 hours = -300 minutes
    })
  })

  describe('#plus', () => {
    it('adds time duration', () => {
      const clockTime = ClockTimeTz.fromObject({ hour: 10, minute: 30 })
      const result = clockTime.plus({ hours: 2, minutes: 15 })
      expect(result.hour).toEqual(12)
      expect(result.minute).toEqual(45)
    })

    it('handles overflow into next day', () => {
      const clockTime = ClockTimeTz.fromObject({ hour: 23, minute: 30 })
      const result = clockTime.plus({ hours: 1 })
      expect(result.hour).toEqual(0)
      expect(result.minute).toEqual(30)
    })
  })

  describe('#minus', () => {
    it('subtracts time duration', () => {
      const clockTime = ClockTimeTz.fromObject({ hour: 12, minute: 45 })
      const result = clockTime.minus({ hours: 2, minutes: 15 })
      expect(result.hour).toEqual(10)
      expect(result.minute).toEqual(30)
    })

    it('handles underflow into previous day', () => {
      const clockTime = ClockTimeTz.fromObject({ hour: 0, minute: 30 })
      const result = clockTime.minus({ hours: 1 })
      expect(result.hour).toEqual(23)
      expect(result.minute).toEqual(30)
    })
  })

  describe('.min', () => {
    it('returns the earlier time', () => {
      const time1 = ClockTimeTz.fromObject({ hour: 10, minute: 30 })
      const time2 = ClockTimeTz.fromObject({ hour: 14, minute: 45 })
      expect(ClockTimeTz.min(time1, time2)).toEqualClockTimeTz(time1)
    })

    it('returns null for empty array', () => {
      expect(ClockTimeTz.min()).toBeNull()
    })
  })

  describe('.max', () => {
    it('returns the later time', () => {
      const time1 = ClockTimeTz.fromObject({ hour: 10, minute: 30 })
      const time2 = ClockTimeTz.fromObject({ hour: 14, minute: 45 })
      expect(ClockTimeTz.max(time1, time2)).toEqualClockTimeTz(time2)
    })

    it('returns null for empty array', () => {
      expect(ClockTimeTz.max()).toBeNull()
    })
  })

  describe('#diff', () => {
    describe('with single unit argument', () => {
      it('returns difference in hours', () => {
        const t1 = ClockTimeTz.fromObject({ hour: 15, minute: 30 })
        const t2 = ClockTimeTz.fromObject({ hour: 10, minute: 0 })
        const diff = t1.diff(t2, 'hours')
        expect(diff).toEqual({ hours: 5.5 })
      })

      it('returns difference in minutes', () => {
        const t1 = ClockTimeTz.fromObject({ hour: 14, minute: 45 })
        const t2 = ClockTimeTz.fromObject({ hour: 14, minute: 15 })
        const diff = t1.diff(t2, 'minutes')
        expect(diff).toEqual({ minutes: 30 })
      })

      it('returns difference in seconds', () => {
        const t1 = ClockTimeTz.fromObject({ hour: 10, minute: 0, second: 45 })
        const t2 = ClockTimeTz.fromObject({ hour: 10, minute: 0, second: 15 })
        const diff = t1.diff(t2, 'seconds')
        expect(diff).toEqual({ seconds: 30 })
      })

      it('returns difference in milliseconds', () => {
        const t1 = ClockTimeTz.fromObject({ hour: 10, minute: 0, second: 0, millisecond: 500 })
        const t2 = ClockTimeTz.fromObject({ hour: 10, minute: 0, second: 0, millisecond: 250 })
        const diff = t1.diff(t2, 'milliseconds')
        expect(diff).toEqual({ milliseconds: 250 })
      })

      it('returns difference in microseconds', () => {
        const t1 = ClockTimeTz.fromObject({
          hour: 10,
          minute: 0,
          second: 0,
          millisecond: 0,
          microsecond: 500,
        })
        const t2 = ClockTimeTz.fromObject({
          hour: 10,
          minute: 0,
          second: 0,
          millisecond: 0,
          microsecond: 100,
        })
        const diff = t1.diff(t2, 'microseconds')
        expect(diff).toEqual({ microseconds: 400 })
      })

      it('handles negative differences', () => {
        const t1 = ClockTimeTz.fromObject({ hour: 10, minute: 30 })
        const t2 = ClockTimeTz.fromObject({ hour: 14, minute: 45 })
        const diff = t1.diff(t2, 'hours')
        expect(diff.hours).toBeCloseTo(-4.25, 2)
      })
    })

    describe('with multiple units argument (array)', () => {
      it('returns difference in hours and minutes', () => {
        const t1 = ClockTimeTz.fromObject({ hour: 15, minute: 45 })
        const t2 = ClockTimeTz.fromObject({ hour: 10, minute: 15 })
        const diff = t1.diff(t2, ['hours', 'minutes'])
        expect(diff).toEqual({ hours: 5, minutes: 30 })
      })

      it('returns difference in minutes and seconds', () => {
        const t1 = ClockTimeTz.fromObject({ hour: 10, minute: 30, second: 45 })
        const t2 = ClockTimeTz.fromObject({ hour: 10, minute: 15, second: 15 })
        const diff = t1.diff(t2, ['minutes', 'seconds'])
        expect(diff).toEqual({ minutes: 15, seconds: 30 })
      })

      it('returns difference in seconds, milliseconds, and microseconds', () => {
        const t1 = ClockTimeTz.fromObject({
          hour: 10,
          minute: 0,
          second: 5,
          millisecond: 750,
          microsecond: 250,
        })
        const t2 = ClockTimeTz.fromObject({
          hour: 10,
          minute: 0,
          second: 3,
          millisecond: 500,
          microsecond: 100,
        })
        const diff = t1.diff(t2, ['seconds', 'milliseconds', 'microseconds'])
        expect(diff).toEqual({ seconds: 2, milliseconds: 250, microseconds: 150 })
      })
    })

    describe('with no unit argument', () => {
      it('returns all supported time diff units', () => {
        const t1 = ClockTimeTz.fromObject({
          hour: 12,
          minute: 30,
          second: 45,
          millisecond: 500,
          microsecond: 250,
        })
        const t2 = ClockTimeTz.fromObject({
          hour: 10,
          minute: 15,
          second: 30,
          millisecond: 250,
          microsecond: 100,
        })
        const diff = t1.diff(t2)
        expect(diff).toEqual({
          hours: 2,
          minutes: 15,
          seconds: 15,
          milliseconds: 250,
          microseconds: 150,
        })
      })
    })
  })

  describe('#equals', () => {
    context('when times are equal', () => {
      it('returns true', () => {
        const time1 = ClockTimeTz.fromObject({ hour: 10, minute: 30, second: 45 })
        const time2 = ClockTimeTz.fromObject({ hour: 10, minute: 30, second: 45 })
        expect(time1.equals(time2)).toBe(true)
      })
    })

    context('when times are not equal', () => {
      it('returns false', () => {
        const time1 = ClockTimeTz.fromObject({ hour: 10, minute: 30 })
        const time2 = ClockTimeTz.fromObject({ hour: 10, minute: 31 })
        expect(time1.equals(time2)).toBe(false)
      })
    })
  })

  describe('#setZone', () => {
    it('converts the time to a different timezone', () => {
      const timeUTC = ClockTimeTz.fromObject({ hour: 10, minute: 30 }, { zone: 'UTC' })
      const timeNY = timeUTC.setZone('America/New_York')
      // 10:30 UTC = 05:30 EST (or 06:30 EDT depending on DST)
      expect(timeNY.hour).toBeLessThanOrEqual(6)
      expect(timeNY.hour).toBeGreaterThanOrEqual(5)
      expect(timeNY.minute).toEqual(30)
    })
  })

  describe('#hasSame', () => {
    context('when times share the same specified unit', () => {
      it('returns true', () => {
        const time1 = ClockTimeTz.fromObject({ hour: 10, minute: 30, second: 15 })
        const time2 = ClockTimeTz.fromObject({ hour: 10, minute: 30, second: 45 })
        expect(time1.hasSame(time2, 'hour')).toBe(true)
        expect(time1.hasSame(time2, 'minute')).toBe(true)
        expect(time1.hasSame(time2, 'second')).toBe(false)
      })
    })
  })

  describe('#startOf', () => {
    it('returns time at the start of the specified unit', () => {
      const time = ClockTimeTz.fromObject({
        hour: 10,
        minute: 30,
        second: 45,
        millisecond: 123,
        microsecond: 456,
      })
      const startOfHour = time.startOf('hour')
      expect(startOfHour.hour).toEqual(10)
      expect(startOfHour.minute).toEqual(0)
      expect(startOfHour.second).toEqual(0)
      expect(startOfHour.millisecond).toEqual(0)
      expect(startOfHour.microsecond).toEqual(0)
    })
  })

  describe('#endOf', () => {
    it('returns time at the end of the specified unit', () => {
      const time = ClockTimeTz.fromObject({ hour: 10, minute: 30 })
      const endOfHour = time.endOf('hour')
      expect(endOfHour.hour).toEqual(10)
      expect(endOfHour.minute).toEqual(59)
      expect(endOfHour.second).toEqual(59)
      expect(endOfHour.millisecond).toEqual(999)
      expect(endOfHour.microsecond).toEqual(999)
    })
  })

  describe('#set', () => {
    it('sets a single time unit', () => {
      const time = ClockTimeTz.fromObject({ hour: 10, minute: 30, second: 45 })
      const updated = time.set({ hour: 14 })
      expect(updated.hour).toEqual(14)
      expect(updated.minute).toEqual(30)
      expect(updated.second).toEqual(45)
    })

    it('sets multiple time units', () => {
      const time = ClockTimeTz.fromObject({ hour: 10, minute: 30, second: 45 })
      const updated = time.set({ hour: 14, minute: 15, second: 20 })
      expect(updated.hour).toEqual(14)
      expect(updated.minute).toEqual(15)
      expect(updated.second).toEqual(20)
    })

    it('sets microsecond', () => {
      const time = ClockTimeTz.fromISO('2024-03-02T10:30:45.123456')
      const updated = time.set({ microsecond: 500 })
      expect(updated.toISOTime()).toEqual('10:30:45.123500Z')
    })

    it('normalizes microsecond > 999 into milliseconds and remainder', () => {
      const time = ClockTimeTz.fromISO('2024-03-02T10:30:45.077000')
      const updated = time.set({ microsecond: 1500 })
      expect(updated.millisecond).toEqual(78)
      expect(updated.microsecond).toEqual(500)
    })

    it('does not mutate the original ClockTimeTz', () => {
      const time = ClockTimeTz.fromObject({ hour: 10, minute: 30 })
      time.set({ hour: 14 })
      expect(time.hour).toEqual(10)
    })
  })

  describe('comparison operators', () => {
    describe('<', () => {
      it('compares times correctly', () => {
        const time1 = ClockTimeTz.fromObject({ hour: 10, minute: 30 })
        const time2 = ClockTimeTz.fromObject({ hour: 14, minute: 45 })
        expect(time1 < time2).toBe(true)
        expect(time2 < time1).toBe(false)
      })
    })

    describe('>', () => {
      it('compares times correctly', () => {
        const time1 = ClockTimeTz.fromObject({ hour: 10, minute: 30 })
        const time2 = ClockTimeTz.fromObject({ hour: 14, minute: 45 })
        expect(time2 > time1).toBe(true)
        expect(time1 > time2).toBe(false)
      })
    })
  })
})
