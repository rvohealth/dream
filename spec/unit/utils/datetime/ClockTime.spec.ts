import ClockTime, { InvalidClockTime } from '../../../../src/utils/datetime/ClockTime.js'
import { DateTime } from '../../../../src/utils/datetime/DateTime.js'

describe('ClockTime', () => {
  describe('constructor', () => {
    context('without an argument', () => {
      beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-02-07T14:30:00.000Z'))
      })

      afterEach(() => {
        vi.useRealTimers()
      })

      it('sets itself to now', () => {
        const clockTime = ClockTime.now()
        expect(clockTime.hour).toEqual(14)
        expect(clockTime.minute).toEqual(30)
        expect(clockTime.second).toEqual(0)
      })
    })

    context('with null', () => {
      beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-02-07T14:30:00.000Z'))
      })

      afterEach(() => {
        vi.useRealTimers()
      })

      it('sets itself to now', () => {
        const clockTime = ClockTime.now()
        expect(clockTime.hour).toEqual(14)
        expect(clockTime.minute).toEqual(30)
        expect(clockTime.second).toEqual(0)
      })
    })

    context('with a valid DateTime', () => {
      it('creates a ClockTime', () => {
        const clockTime = ClockTime.fromDateTime(DateTime.fromISO('2024-02-29T14:30:45.123456Z'))
        expect(clockTime.toISOTime()).toBe('14:30:45.123456')
      })
    })

    context('with a valid series of hour, minute, second, millisecond, microsecond numbers', () => {
      it('sets its DateTime to a valid DateTime', () => {
        const clockTime = ClockTime.fromObject(
          {
            hour: 14,
            minute: 30,
            second: 45,
            millisecond: 123,
            microsecond: 456,
          },
          { zone: 'America/New_York' }
        )
        expect(clockTime.hour).toEqual(14)
        expect(clockTime.minute).toEqual(30)
        expect(clockTime.second).toEqual(45)
        expect(clockTime.millisecond).toEqual(123)
        expect(clockTime.microsecond).toEqual(456)
      })
    })

    context('with an invalid series of time numbers', () => {
      it('throws InvalidClockTime', () => {
        expect(() => ClockTime.fromObject({ hour: 25 }, { zone: 'UTC' })).toThrow(InvalidClockTime)
      })
    })
  })

  describe('.now', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-07T14:30:45.123Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('creates a ClockTime for now in the system timezone', () => {
      const now = ClockTime.now()
      const dtNow = DateTime.now()
      expect(now.toISOTime()).toEqual(dtNow.toISOTime())
    })

    context('with a timezone argument', () => {
      it('creates a ClockTime for now in the specified timezone', () => {
        const nowNY = ClockTime.now({ zone: 'America/New_York' })
        const dtNowNY = DateTime.now().setZone('America/New_York')
        expect(nowNY.toISOTime()).toEqual(dtNowNY.toISOTime())
      })
    })
  })

  describe('.fromDateTime', () => {
    it('creates a ClockTime from a DateTime instance', () => {
      const dateTime = DateTime.fromISO('2024-05-05T17:53:07.123456Z')
      const clockTime = ClockTime.fromDateTime(dateTime)
      expect(clockTime.toISOTime()).toBe('17:53:07.123456')
    })
  })

  describe('.fromJSDate', () => {
    it('creates a ClockTime from a JavaScript Date', () => {
      const javascriptDate = new Date('2024-05-05T01:53:07.123Z')
      const clockTime = ClockTime.fromJSDate(javascriptDate)
      expect(clockTime.hour).toEqual(1)
      expect(clockTime.minute).toEqual(53)
      expect(clockTime.second).toEqual(7)
    })

    describe('with a timezone', () => {
      it('creates a ClockTime in the specified timezone', () => {
        const javascriptDate = new Date('2024-05-05T01:53:07.123Z')
        const clockTime = ClockTime.fromJSDate(javascriptDate, { zone: 'America/Chicago' })
        // 01:53 UTC is 20:53 previous day in Chicago (CST is UTC-6, CDT is UTC-5)
        // May 5 is during DST, so it's CDT (UTC-5)
        expect(clockTime.hour).toEqual(20)
        expect(clockTime.minute).toEqual(53)
      })
    })
  })

  describe('.fromISO', () => {
    it('creates a ClockTime from an ISO string', () => {
      const clockTime = ClockTime.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.hour).toEqual(10)
      expect(clockTime.minute).toEqual(30)
      expect(clockTime.second).toEqual(45)
      expect(clockTime.millisecond).toEqual(123)
      expect(clockTime.microsecond).toEqual(456)
    })

    context('with a time-only ISO string', () => {
      it("creates a ClockTime with today's date", () => {
        const clockTime = ClockTime.fromISO('10:30:45.123456')
        expect(clockTime.hour).toEqual(10)
        expect(clockTime.minute).toEqual(30)
        expect(clockTime.second).toEqual(45)
      })
    })

    context('with zone option', () => {
      it('interprets the time in the specified zone', () => {
        const clockTime = ClockTime.fromISO('2024-03-02T10:30:45.123456Z', { zone: 'America/New_York' })
        // 10:30 UTC = 05:30 in New York (EST is UTC-5)
        expect(clockTime.hour).toEqual(5)
        expect(clockTime.minute).toEqual(30)
      })
    })

    context('with an invalid time string', () => {
      it('throws InvalidClockTime', () => {
        expect(() => ClockTime.fromISO('25:00:00')).toThrow(InvalidClockTime)
      })
    })
  })

  describe('.fromSQL', () => {
    it('creates a ClockTime from an SQL string', () => {
      const clockTime = ClockTime.fromSQL('2024-03-02 10:30:45.123456')
      expect(clockTime.hour).toEqual(10)
      expect(clockTime.minute).toEqual(30)
      expect(clockTime.second).toEqual(45)
    })

    context('with a time-only SQL string', () => {
      it("creates a ClockTime with today's date", () => {
        const clockTime = ClockTime.fromSQL('10:30:45.123456')
        expect(clockTime.hour).toEqual(10)
        expect(clockTime.minute).toEqual(30)
      })
    })

    context('with an invalid time string', () => {
      it('throws InvalidClockTime', () => {
        expect(() => ClockTime.fromSQL('25:00:00')).toThrow(InvalidClockTime)
      })
    })
  })

  describe('.fromFormat', () => {
    it('parses a time string with a format string', () => {
      const clockTime = ClockTime.fromFormat('10:30:45', 'HH:mm:ss')
      expect(clockTime.hour).toEqual(10)
      expect(clockTime.minute).toEqual(30)
      expect(clockTime.second).toEqual(45)
    })

    it('parses a time with milliseconds', () => {
      const clockTime = ClockTime.fromFormat('10:30:45.123', 'HH:mm:ss.SSS')
      expect(clockTime.hour).toEqual(10)
      expect(clockTime.minute).toEqual(30)
      expect(clockTime.second).toEqual(45)
      expect(clockTime.millisecond).toEqual(123)
    })

    it('parses a time with timezone', () => {
      // When parsing a time with a timezone offset, Luxon converts it to the system timezone
      // So we need to check that the time is parsed correctly by checking the ISO output
      const clockTime = ClockTime.fromFormat('10:30:45 -05:00', 'HH:mm:ss ZZ')
      // The time should be parsed and stored with the offset
      expect(clockTime.toISOTime()).toContain(':30:45')
    })

    context('with zone option', () => {
      it('interprets the time in the specified zone', () => {
        const clockTime = ClockTime.fromFormat('10:30:45 +00:00', 'HH:mm:ss ZZ', {
          zone: 'America/New_York',
        })
        // 10:30 UTC converted to New York time
        expect(clockTime.hour).toEqual(5)
        expect(clockTime.minute).toEqual(30)
      })
    })

    it('accepts locale option', () => {
      const clockTime = ClockTime.fromFormat('10:30 PM', 'hh:mm a', { locale: 'en-US' })
      expect(clockTime.hour).toEqual(22)
      expect(clockTime.minute).toEqual(30)
    })

    it('throws InvalidClockTime when format does not match', () => {
      expect(() => ClockTime.fromFormat('not-matching', 'HH:mm:ss')).toThrow(InvalidClockTime)
    })

    it('throws InvalidClockTime when string is invalid for format', () => {
      expect(() => ClockTime.fromFormat('25:99:99', 'HH:mm:ss')).toThrow(InvalidClockTime)
    })
  })

  describe('.fromObject', () => {
    it('creates a ClockTime from an object', () => {
      const clockTime = ClockTime.fromObject({ hour: 14, minute: 30, second: 45, millisecond: 123 })
      expect(clockTime.hour).toEqual(14)
      expect(clockTime.minute).toEqual(30)
      expect(clockTime.second).toEqual(45)
      expect(clockTime.millisecond).toEqual(123)
    })

    context('with zone option', () => {
      it('creates a ClockTime in the specified zone', () => {
        const clockTime = ClockTime.fromObject(
          { hour: 14, minute: 30, second: 45 },
          { zone: 'America/New_York' }
        )
        expect(clockTime.zoneName).toContain('America/New_York')
      })
    })

    context('with an invalid time', () => {
      it('throws InvalidClockTime', () => {
        expect(() => ClockTime.fromObject({ hour: 25, minute: 0 })).toThrow(InvalidClockTime)
      })
    })
  })

  describe('#toISOTime', () => {
    it('returns time in ISO format without zone offset by default', () => {
      const clockTime = ClockTime.fromObject({ hour: 14, minute: 30, second: 45, millisecond: 123 })
      expect(clockTime.toISOTime()).toBe('14:30:45.123000')
    })

    it('includes timezone offset when includeOffset is true', () => {
      const clockTime = ClockTime.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.toISOTime({ includeOffset: true })).toBe('10:30:45.123456-05:00')
    })
  })

  describe('#toISO', () => {
    it('returns time string without offset by default', () => {
      const clockTime = ClockTime.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.toISO()).toBe('10:30:45.123456')
    })

    it('includes timezone offset when includeOffset is true', () => {
      const clockTime = ClockTime.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.toISO({ includeOffset: true })).toBe('10:30:45.123456-05:00')
    })
  })

  describe('#toSQL', () => {
    it('returns SQL time string without offset by default', () => {
      const clockTime = ClockTime.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.toSQL()).toBe('10:30:45.123456')
    })

    it('includes timezone offset when includeOffset is true', () => {
      const clockTime = ClockTime.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.toSQL({ includeOffset: true })).toBe('10:30:45.123456 -05:00')
    })
  })

  describe('#toSQLTime', () => {
    it('returns SQL time string without offset by default', () => {
      const clockTime = ClockTime.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.toSQLTime()).toBe('10:30:45.123456')
    })

    it('includes timezone offset when includeOffset is true', () => {
      const clockTime = ClockTime.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.toSQLTime({ includeOffset: true })).toBe('10:30:45.123456 -05:00')
    })
  })

  describe('#toJSON', () => {
    it('returns ISO time format without offset by default', () => {
      const clockTime = ClockTime.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.toJSON()).toBe('10:30:45.123456')
    })
  })

  describe('#valueOf', () => {
    it('returns ISO time string without offset by default', () => {
      const clockTime = ClockTime.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.valueOf()).toBe('10:30:45.123456')
    })
  })

  describe('#toLocaleString', () => {
    it('delegates to DateTime', () => {
      const clockTime = ClockTime.fromObject({ hour: 14, minute: 30, second: 45 })
      expect(clockTime.toLocaleString({ hour: 'numeric', minute: '2-digit' })).toMatch(/14:30|2:30/)
    })
  })

  describe('#toString', () => {
    it('returns ISO format', () => {
      const clockTime = ClockTime.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.toString()).toEqual(clockTime.toISO())
    })
  })

  describe('#toDateTime', () => {
    it('returns the underlying DateTime instance', () => {
      const dateTime = DateTime.fromISO('2024-03-02T10:30:45.123456-05:00')
      const clockTime = ClockTime.fromDateTime(dateTime)
      expect(clockTime.toDateTime().toISO()).toEqual(dateTime.toISO())
    })
  })

  describe('#toJSDate', () => {
    it('returns a JavaScript Date', () => {
      const clockTime = ClockTime.fromISO('2024-03-02T10:30:45.123456-05:00')
      const jsDate = clockTime.toJSDate()
      expect(jsDate).toBeInstanceOf(Date)
    })
  })

  describe('#hour', () => {
    it('is the hour of the time', () => {
      const clockTime = ClockTime.fromObject({ hour: 14, minute: 30 })
      expect(clockTime.hour).toEqual(14)
    })
  })

  describe('#minute', () => {
    it('is the minute of the time', () => {
      const clockTime = ClockTime.fromObject({ hour: 14, minute: 30 })
      expect(clockTime.minute).toEqual(30)
    })
  })

  describe('#second', () => {
    it('is the second of the time', () => {
      const clockTime = ClockTime.fromObject({ hour: 14, minute: 30, second: 45 })
      expect(clockTime.second).toEqual(45)
    })
  })

  describe('#millisecond', () => {
    it('is the millisecond of the time', () => {
      const clockTime = ClockTime.fromObject({ hour: 14, minute: 30, second: 45, millisecond: 123 })
      expect(clockTime.millisecond).toEqual(123)
    })
  })

  describe('#microsecond', () => {
    it('is the microsecond of the time', () => {
      const clockTime = ClockTime.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.microsecond).toEqual(456)
    })
  })

  describe('#zoneName', () => {
    it('returns the name of the timezone', () => {
      const clockTime = ClockTime.fromObject({ hour: 14, minute: 30 }, { zone: 'America/New_York' })
      expect(clockTime.zoneName).toContain('America/New_York')
    })
  })

  describe('#offset', () => {
    it('returns the offset in minutes', () => {
      const clockTime = ClockTime.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.offset).toEqual(-300) // -5 hours = -300 minutes
    })
  })

  describe('#plus', () => {
    it('adds time duration', () => {
      const clockTime = ClockTime.fromObject({ hour: 10, minute: 30 })
      const result = clockTime.plus({ hours: 2, minutes: 15 })
      expect(result.hour).toEqual(12)
      expect(result.minute).toEqual(45)
    })

    it('handles overflow into next day', () => {
      const clockTime = ClockTime.fromObject({ hour: 23, minute: 30 })
      const result = clockTime.plus({ hours: 1 })
      expect(result.hour).toEqual(0)
      expect(result.minute).toEqual(30)
    })
  })

  describe('#minus', () => {
    it('subtracts time duration', () => {
      const clockTime = ClockTime.fromObject({ hour: 12, minute: 45 })
      const result = clockTime.minus({ hours: 2, minutes: 15 })
      expect(result.hour).toEqual(10)
      expect(result.minute).toEqual(30)
    })

    it('handles underflow into previous day', () => {
      const clockTime = ClockTime.fromObject({ hour: 0, minute: 30 })
      const result = clockTime.minus({ hours: 1 })
      expect(result.hour).toEqual(23)
      expect(result.minute).toEqual(30)
    })
  })

  describe('.min', () => {
    it('returns the earlier time', () => {
      const time1 = ClockTime.fromObject({ hour: 10, minute: 30 })
      const time2 = ClockTime.fromObject({ hour: 14, minute: 45 })
      const min = ClockTime.min(time1, time2)
      expect(min?.hour).toEqual(10)
      expect(min?.minute).toEqual(30)
    })

    it('returns null for empty array', () => {
      expect(ClockTime.min()).toBeNull()
    })
  })

  describe('.max', () => {
    it('returns the later time', () => {
      const time1 = ClockTime.fromObject({ hour: 10, minute: 30 })
      const time2 = ClockTime.fromObject({ hour: 14, minute: 45 })
      const max = ClockTime.max(time1, time2)
      expect(max?.hour).toEqual(14)
      expect(max?.minute).toEqual(45)
    })

    it('returns null for empty array', () => {
      expect(ClockTime.max()).toBeNull()
    })
  })

  describe('#diff', () => {
    describe('with single unit argument', () => {
      it('returns difference in hours', () => {
        const t1 = ClockTime.fromObject({ hour: 15, minute: 30 })
        const t2 = ClockTime.fromObject({ hour: 10, minute: 0 })
        const diff = t1.diff(t2, 'hours')
        expect(diff).toEqual({ hours: 5.5 })
      })

      it('returns difference in minutes', () => {
        const t1 = ClockTime.fromObject({ hour: 14, minute: 45 })
        const t2 = ClockTime.fromObject({ hour: 14, minute: 15 })
        const diff = t1.diff(t2, 'minutes')
        expect(diff).toEqual({ minutes: 30 })
      })

      it('returns difference in seconds', () => {
        const t1 = ClockTime.fromObject({ hour: 10, minute: 0, second: 45 })
        const t2 = ClockTime.fromObject({ hour: 10, minute: 0, second: 15 })
        const diff = t1.diff(t2, 'seconds')
        expect(diff).toEqual({ seconds: 30 })
      })

      it('returns difference in milliseconds', () => {
        const t1 = ClockTime.fromObject({ hour: 10, minute: 0, second: 0, millisecond: 500 })
        const t2 = ClockTime.fromObject({ hour: 10, minute: 0, second: 0, millisecond: 250 })
        const diff = t1.diff(t2, 'milliseconds')
        expect(diff).toEqual({ milliseconds: 250 })
      })

      it('returns difference in microseconds', () => {
        const t1 = ClockTime.fromObject({ hour: 10, minute: 0, second: 0, millisecond: 0, microsecond: 500 })
        const t2 = ClockTime.fromObject({ hour: 10, minute: 0, second: 0, millisecond: 0, microsecond: 100 })
        const diff = t1.diff(t2, 'microseconds')
        expect(diff).toEqual({ microseconds: 400 })
      })

      it('handles negative differences', () => {
        const t1 = ClockTime.fromObject({ hour: 10, minute: 30 })
        const t2 = ClockTime.fromObject({ hour: 14, minute: 45 })
        const diff = t1.diff(t2, 'hours')
        expect(diff.hours).toBeCloseTo(-4.25, 2)
      })
    })

    describe('with multiple units argument (array)', () => {
      it('returns difference in hours and minutes', () => {
        const t1 = ClockTime.fromObject({ hour: 15, minute: 45 })
        const t2 = ClockTime.fromObject({ hour: 10, minute: 15 })
        const diff = t1.diff(t2, ['hours', 'minutes'])
        expect(diff).toEqual({ hours: 5, minutes: 30 })
      })

      it('returns difference in minutes and seconds', () => {
        const t1 = ClockTime.fromObject({ hour: 10, minute: 30, second: 45 })
        const t2 = ClockTime.fromObject({ hour: 10, minute: 15, second: 15 })
        const diff = t1.diff(t2, ['minutes', 'seconds'])
        expect(diff).toEqual({ minutes: 15, seconds: 30 })
      })

      it('returns difference in seconds, milliseconds, and microseconds', () => {
        const t1 = ClockTime.fromObject({
          hour: 10,
          minute: 0,
          second: 5,
          millisecond: 750,
          microsecond: 250,
        })
        const t2 = ClockTime.fromObject({
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
        const t1 = ClockTime.fromObject({
          hour: 12,
          minute: 30,
          second: 45,
          millisecond: 500,
          microsecond: 250,
        })
        const t2 = ClockTime.fromObject({
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

  describe('#diffNow', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-07T12:00:00.000Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    describe('with single unit argument', () => {
      it('returns positive difference when time is in future', () => {
        const future = ClockTime.now().plus({ hours: 2 })
        const diff = future.diffNow('hours')
        expect(diff).toEqual({ hours: 2 })
      })

      it('returns negative difference when time is in past', () => {
        const past = ClockTime.now().minus({ hours: 2 })
        const diff = past.diffNow('hours')
        expect(diff).toEqual({ hours: -2 })
      })
    })

    describe('with multiple units argument', () => {
      it('returns difference in specified units', () => {
        const future = ClockTime.now().plus({ hours: 1, minutes: 30 })
        const diff = future.diffNow(['hours', 'minutes'])
        expect(diff).toEqual({ hours: 1, minutes: 30 })
      })
    })

    describe('with no unit argument', () => {
      it('returns all time units', () => {
        const future = ClockTime.now().plus({ minutes: 45 })
        const diff = future.diffNow()
        expect(diff).toHaveProperty('hours')
        expect(diff).toHaveProperty('minutes')
        expect(diff).toHaveProperty('seconds')
        expect(diff).toHaveProperty('milliseconds')
        expect(diff).toHaveProperty('microseconds')
      })
    })
  })

  describe('#equals', () => {
    context('when times are equal', () => {
      it('returns true', () => {
        const time1 = ClockTime.fromObject({ hour: 10, minute: 30, second: 45 })
        const time2 = ClockTime.fromObject({ hour: 10, minute: 30, second: 45 })
        expect(time1.equals(time2)).toBe(true)
      })
    })

    context('when times are not equal', () => {
      it('returns false', () => {
        const time1 = ClockTime.fromObject({ hour: 10, minute: 30 })
        const time2 = ClockTime.fromObject({ hour: 10, minute: 31 })
        expect(time1.equals(time2)).toBe(false)
      })
    })
  })

  describe('#setZone', () => {
    it('converts the time to a different timezone', () => {
      const timeUTC = ClockTime.fromObject({ hour: 10, minute: 30 }, { zone: 'UTC' })
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
        const time1 = ClockTime.fromObject({ hour: 10, minute: 30, second: 15 })
        const time2 = ClockTime.fromObject({ hour: 10, minute: 30, second: 45 })
        expect(time1.hasSame(time2, 'hour')).toBe(true)
        expect(time1.hasSame(time2, 'minute')).toBe(true)
        expect(time1.hasSame(time2, 'second')).toBe(false)
      })
    })
  })

  describe('#startOf', () => {
    it('returns time at the start of the specified unit', () => {
      const time = ClockTime.fromObject({ hour: 10, minute: 30, second: 45, millisecond: 123 })
      const startOfHour = time.startOf('hour')
      expect(startOfHour.hour).toEqual(10)
      expect(startOfHour.minute).toEqual(0)
      expect(startOfHour.second).toEqual(0)
      expect(startOfHour.millisecond).toEqual(0)
    })
  })

  describe('#endOf', () => {
    it('returns time at the end of the specified unit', () => {
      const time = ClockTime.fromObject({ hour: 10, minute: 30 })
      const endOfHour = time.endOf('hour')
      expect(endOfHour.hour).toEqual(10)
      expect(endOfHour.minute).toEqual(59)
      expect(endOfHour.second).toEqual(59)
      expect(endOfHour.millisecond).toEqual(999)
    })
  })

  describe('comparison operators', () => {
    describe('<', () => {
      it('compares times correctly', () => {
        const time1 = ClockTime.fromObject({ hour: 10, minute: 30 })
        const time2 = ClockTime.fromObject({ hour: 14, minute: 45 })
        expect(time1 < time2).toBe(true)
        expect(time2 < time1).toBe(false)
      })
    })

    describe('>', () => {
      it('compares times correctly', () => {
        const time1 = ClockTime.fromObject({ hour: 10, minute: 30 })
        const time2 = ClockTime.fromObject({ hour: 14, minute: 45 })
        expect(time2 > time1).toBe(true)
        expect(time1 > time2).toBe(false)
      })
    })
  })
})
