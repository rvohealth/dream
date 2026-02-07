import TimeWithZone, { InvalidTimeWithZone } from '../../../../src/utils/datetime/TimeWithZone.js'
import { DateTime } from '../../../../src/utils/datetime/DateTime.js'

describe('TimeWithZone', () => {
  describe('constructor', () => {
    context('without an argument', () => {
      it('sets itself to now', () => {
        const timeWithZone = new TimeWithZone()
        const now = TimeWithZone.now()
        // Allow 1 second tolerance for test execution time
        expect(Math.abs(timeWithZone.diff(now, 'seconds'))).toBeLessThan(1)
      })
    })

    context('with null', () => {
      it('sets itself to now', () => {
        const timeWithZone = new TimeWithZone(null)
        const now = TimeWithZone.now()
        // Allow 1 second tolerance for test execution time
        expect(Math.abs(timeWithZone.diff(now, 'seconds'))).toBeLessThan(1)
      })
    })

    context('with a valid DateTime', () => {
      it('sets its DateTime to a valid DateTime', () => {
        const timeWithZone = new TimeWithZone(DateTime.fromISO('2024-02-29T14:30:45.123456Z'))
        expect(timeWithZone.toDateTime()?.isValid).toBe(true)
        // Z and +00:00 are equivalent for UTC
        expect(timeWithZone.toISOTime()).toMatch(/14:30:45\.123456(Z|\+00:00)/)
      })
    })

    context('with a valid series of hour, minute, second, millisecond, microsecond numbers', () => {
      it('sets its DateTime to a valid DateTime', () => {
        const timeWithZone = new TimeWithZone(14, 30, 45, 123, 456, 'America/New_York')
        expect(timeWithZone.toDateTime()?.isValid).toBe(true)
        expect(timeWithZone.hour).toEqual(14)
        expect(timeWithZone.minute).toEqual(30)
        expect(timeWithZone.second).toEqual(45)
        expect(timeWithZone.millisecond).toEqual(123)
        expect(timeWithZone.microsecond).toEqual(456)
      })
    })

    context('with an invalid series of time numbers', () => {
      it('throws InvalidTimeWithZone', () => {
        expect(() => new TimeWithZone(25, 0, 0, 0, 0, 'UTC')).toThrow(InvalidTimeWithZone)
      })
    })
  })

  describe('.now', () => {
    it('creates a TimeWithZone for now in the system timezone', () => {
      const now = TimeWithZone.now()
      const dtNow = DateTime.now()
      expect(now.toISOTime()).toEqual(dtNow.toISOTime())
    })

    context('with a timezone argument', () => {
      it('creates a TimeWithZone for now in the specified timezone', () => {
        const nowNY = TimeWithZone.now({ zone: 'America/New_York' })
        const dtNowNY = DateTime.now().setZone('America/New_York')
        expect(nowNY.toISOTime()).toEqual(dtNowNY.toISOTime())
      })
    })
  })

  describe('.fromDateTime', () => {
    it('creates a TimeWithZone from a DateTime instance', () => {
      const dateTime = DateTime.fromISO('2024-05-05T17:53:07.123456Z')
      const timeWithZone = TimeWithZone.fromDateTime(dateTime)
      // Z and +00:00 are equivalent for UTC
      expect(timeWithZone.toISOTime()).toMatch(/17:53:07\.123456(Z|\+00:00)/)
    })
  })

  describe('.fromJSDate', () => {
    it('creates a TimeWithZone from a JavaScript Date', () => {
      const javascriptDate = new Date('2024-05-05T01:53:07.123Z')
      const timeWithZone = TimeWithZone.fromJSDate(javascriptDate)
      expect(timeWithZone.hour).toEqual(1)
      expect(timeWithZone.minute).toEqual(53)
      expect(timeWithZone.second).toEqual(7)
    })

    describe('with a timezone', () => {
      it('creates a TimeWithZone in the specified timezone', () => {
        const javascriptDate = new Date('2024-05-05T01:53:07.123Z')
        const timeWithZone = TimeWithZone.fromJSDate(javascriptDate, { zone: 'America/Chicago' })
        // 01:53 UTC is 20:53 previous day in Chicago (CST is UTC-6, CDT is UTC-5)
        // May 5 is during DST, so it's CDT (UTC-5)
        expect(timeWithZone.hour).toEqual(20)
        expect(timeWithZone.minute).toEqual(53)
      })
    })
  })

  describe('.fromISO', () => {
    it('creates a TimeWithZone from an ISO string', () => {
      const timeWithZone = TimeWithZone.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(timeWithZone.hour).toEqual(10)
      expect(timeWithZone.minute).toEqual(30)
      expect(timeWithZone.second).toEqual(45)
      expect(timeWithZone.millisecond).toEqual(123)
      expect(timeWithZone.microsecond).toEqual(456)
    })

    context('with a time-only ISO string', () => {
      it("creates a TimeWithZone with today's date", () => {
        const timeWithZone = TimeWithZone.fromISO('10:30:45.123456')
        expect(timeWithZone.hour).toEqual(10)
        expect(timeWithZone.minute).toEqual(30)
        expect(timeWithZone.second).toEqual(45)
      })
    })

    context('with zone option', () => {
      it('interprets the time in the specified zone', () => {
        const timeWithZone = TimeWithZone.fromISO('2024-03-02T10:30:45.123456Z', { zone: 'America/New_York' })
        // 10:30 UTC = 05:30 in New York (EST is UTC-5)
        expect(timeWithZone.hour).toEqual(5)
        expect(timeWithZone.minute).toEqual(30)
      })
    })

    context('with an invalid time string', () => {
      it('throws InvalidTimeWithZone', () => {
        expect(() => TimeWithZone.fromISO('25:00:00')).toThrow(InvalidTimeWithZone)
      })
    })
  })

  describe('.fromSQL', () => {
    it('creates a TimeWithZone from an SQL string', () => {
      const timeWithZone = TimeWithZone.fromSQL('2024-03-02 10:30:45.123456')
      expect(timeWithZone.hour).toEqual(10)
      expect(timeWithZone.minute).toEqual(30)
      expect(timeWithZone.second).toEqual(45)
    })

    context('with a time-only SQL string', () => {
      it("creates a TimeWithZone with today's date", () => {
        const timeWithZone = TimeWithZone.fromSQL('10:30:45.123456')
        expect(timeWithZone.hour).toEqual(10)
        expect(timeWithZone.minute).toEqual(30)
      })
    })

    context('with an invalid time string', () => {
      it('throws InvalidTimeWithZone', () => {
        expect(() => TimeWithZone.fromSQL('25:00:00')).toThrow(InvalidTimeWithZone)
      })
    })
  })

  describe('.fromFormat', () => {
    it('parses a time string with a format string', () => {
      const timeWithZone = TimeWithZone.fromFormat('10:30:45', 'HH:mm:ss')
      expect(timeWithZone.hour).toEqual(10)
      expect(timeWithZone.minute).toEqual(30)
      expect(timeWithZone.second).toEqual(45)
    })

    it('parses a time with milliseconds', () => {
      const timeWithZone = TimeWithZone.fromFormat('10:30:45.123', 'HH:mm:ss.SSS')
      expect(timeWithZone.hour).toEqual(10)
      expect(timeWithZone.minute).toEqual(30)
      expect(timeWithZone.second).toEqual(45)
      expect(timeWithZone.millisecond).toEqual(123)
    })

    it('parses a time with timezone', () => {
      // When parsing a time with a timezone offset, Luxon converts it to the system timezone
      // So we need to check that the time is parsed correctly by checking the ISO output
      const timeWithZone = TimeWithZone.fromFormat('10:30:45 -05:00', 'HH:mm:ss ZZ')
      // The time should be parsed and stored with the offset
      expect(timeWithZone.toISOTime()).toContain(':30:45')
    })

    context('with zone option', () => {
      it('interprets the time in the specified zone', () => {
        const timeWithZone = TimeWithZone.fromFormat('10:30:45 +00:00', 'HH:mm:ss ZZ', {
          zone: 'America/New_York',
        })
        // 10:30 UTC converted to New York time
        expect(timeWithZone.hour).toEqual(5)
        expect(timeWithZone.minute).toEqual(30)
      })
    })

    it('accepts locale option', () => {
      const timeWithZone = TimeWithZone.fromFormat('10:30 PM', 'hh:mm a', { locale: 'en-US' })
      expect(timeWithZone.hour).toEqual(22)
      expect(timeWithZone.minute).toEqual(30)
    })

    it('throws InvalidTimeWithZone when format does not match', () => {
      expect(() => TimeWithZone.fromFormat('not-matching', 'HH:mm:ss')).toThrow(InvalidTimeWithZone)
    })

    it('throws InvalidTimeWithZone when string is invalid for format', () => {
      expect(() => TimeWithZone.fromFormat('25:99:99', 'HH:mm:ss')).toThrow(InvalidTimeWithZone)
    })
  })

  describe('.fromObject', () => {
    it('creates a TimeWithZone from an object', () => {
      const timeWithZone = TimeWithZone.fromObject({ hour: 14, minute: 30, second: 45, millisecond: 123 })
      expect(timeWithZone.hour).toEqual(14)
      expect(timeWithZone.minute).toEqual(30)
      expect(timeWithZone.second).toEqual(45)
      expect(timeWithZone.millisecond).toEqual(123)
    })

    context('with zone option', () => {
      it('creates a TimeWithZone in the specified zone', () => {
        const timeWithZone = TimeWithZone.fromObject(
          { hour: 14, minute: 30, second: 45 },
          { zone: 'America/New_York' }
        )
        expect(timeWithZone.zoneName).toContain('America/New_York')
      })
    })

    context('with an invalid time', () => {
      it('throws InvalidTimeWithZone', () => {
        expect(() => TimeWithZone.fromObject({ hour: 25, minute: 0 })).toThrow(InvalidTimeWithZone)
      })
    })
  })

  describe('#toISOTime', () => {
    it('returns time in ISO format with zone offset', () => {
      const timeWithZone = TimeWithZone.fromObject({ hour: 14, minute: 30, second: 45, millisecond: 123 })
      expect(timeWithZone.toISOTime()).toMatch(/14:30:45\.123/)
    })

    context('with includeOffset: false', () => {
      it('returns time without zone offset', () => {
        const timeWithZone = TimeWithZone.fromObject({ hour: 14, minute: 30, second: 45 })
        expect(timeWithZone.toISOTime({ includeOffset: false })).toEqual('14:30:45.000000')
      })
    })
  })

  describe('#toSQLTime', () => {
    it('returns time in SQL format', () => {
      const timeWithZone = TimeWithZone.fromObject({ hour: 14, minute: 30, second: 45, millisecond: 123 })
      expect(timeWithZone.toSQLTime()).toMatch(/14:30:45\.123/)
    })
  })

  describe('#toISO', () => {
    it('returns full ISO datetime string', () => {
      const timeWithZone = TimeWithZone.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(timeWithZone.toISO()).toMatch(/T10:30:45\.123456-05:00/)
    })
  })

  describe('#toSQL', () => {
    it('returns full SQL datetime string', () => {
      const timeWithZone = TimeWithZone.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(timeWithZone.toSQL()).toMatch(/10:30:45\.123456/)
    })
  })

  describe('#toJSON', () => {
    it('returns ISO format', () => {
      const timeWithZone = TimeWithZone.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(timeWithZone.toJSON()).toEqual(timeWithZone.toISO())
    })
  })

  describe('#valueOf', () => {
    it('returns ISO datetime string', () => {
      const timeWithZone = TimeWithZone.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(timeWithZone.valueOf()).toEqual(timeWithZone.toISO())
    })
  })

  describe('#toLocaleString', () => {
    it('delegates to DateTime', () => {
      const timeWithZone = TimeWithZone.fromObject({ hour: 14, minute: 30, second: 45 })
      expect(timeWithZone.toLocaleString({ hour: 'numeric', minute: '2-digit' })).toMatch(/14:30|2:30/)
    })
  })

  describe('#toString', () => {
    it('returns ISO format', () => {
      const timeWithZone = TimeWithZone.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(timeWithZone.toString()).toEqual(timeWithZone.toISO())
    })
  })

  describe('#toDateTime', () => {
    it('returns the underlying DateTime instance', () => {
      const dateTime = DateTime.fromISO('2024-03-02T10:30:45.123456-05:00')
      const timeWithZone = TimeWithZone.fromDateTime(dateTime)
      expect(timeWithZone.toDateTime().toISO()).toEqual(dateTime.toISO())
    })
  })

  describe('#toJSDate', () => {
    it('returns a JavaScript Date', () => {
      const timeWithZone = TimeWithZone.fromISO('2024-03-02T10:30:45.123456-05:00')
      const jsDate = timeWithZone.toJSDate()
      expect(jsDate).toBeInstanceOf(Date)
    })
  })

  describe('#hour', () => {
    it('is the hour of the time', () => {
      const timeWithZone = TimeWithZone.fromObject({ hour: 14, minute: 30 })
      expect(timeWithZone.hour).toEqual(14)
    })
  })

  describe('#minute', () => {
    it('is the minute of the time', () => {
      const timeWithZone = TimeWithZone.fromObject({ hour: 14, minute: 30 })
      expect(timeWithZone.minute).toEqual(30)
    })
  })

  describe('#second', () => {
    it('is the second of the time', () => {
      const timeWithZone = TimeWithZone.fromObject({ hour: 14, minute: 30, second: 45 })
      expect(timeWithZone.second).toEqual(45)
    })
  })

  describe('#millisecond', () => {
    it('is the millisecond of the time', () => {
      const timeWithZone = TimeWithZone.fromObject({ hour: 14, minute: 30, second: 45, millisecond: 123 })
      expect(timeWithZone.millisecond).toEqual(123)
    })
  })

  describe('#microsecond', () => {
    it('is the microsecond of the time', () => {
      const timeWithZone = TimeWithZone.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(timeWithZone.microsecond).toEqual(456)
    })
  })

  describe('#zoneName', () => {
    it('returns the name of the timezone', () => {
      const timeWithZone = TimeWithZone.fromObject({ hour: 14, minute: 30 }, { zone: 'America/New_York' })
      expect(timeWithZone.zoneName).toContain('America/New_York')
    })
  })

  describe('#offset', () => {
    it('returns the offset in minutes', () => {
      const timeWithZone = TimeWithZone.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(timeWithZone.offset).toEqual(-300) // -5 hours = -300 minutes
    })
  })

  describe('#plus', () => {
    it('adds time duration', () => {
      const timeWithZone = TimeWithZone.fromObject({ hour: 10, minute: 30 })
      const result = timeWithZone.plus({ hours: 2, minutes: 15 })
      expect(result.hour).toEqual(12)
      expect(result.minute).toEqual(45)
    })

    it('handles overflow into next day', () => {
      const timeWithZone = TimeWithZone.fromObject({ hour: 23, minute: 30 })
      const result = timeWithZone.plus({ hours: 1 })
      expect(result.hour).toEqual(0)
      expect(result.minute).toEqual(30)
    })
  })

  describe('#minus', () => {
    it('subtracts time duration', () => {
      const timeWithZone = TimeWithZone.fromObject({ hour: 12, minute: 45 })
      const result = timeWithZone.minus({ hours: 2, minutes: 15 })
      expect(result.hour).toEqual(10)
      expect(result.minute).toEqual(30)
    })

    it('handles underflow into previous day', () => {
      const timeWithZone = TimeWithZone.fromObject({ hour: 0, minute: 30 })
      const result = timeWithZone.minus({ hours: 1 })
      expect(result.hour).toEqual(23)
      expect(result.minute).toEqual(30)
    })
  })

  describe('.min', () => {
    it('returns the earlier time', () => {
      const time1 = TimeWithZone.fromObject({ hour: 10, minute: 30 })
      const time2 = TimeWithZone.fromObject({ hour: 14, minute: 45 })
      const min = TimeWithZone.min(time1, time2)
      expect(min?.hour).toEqual(10)
      expect(min?.minute).toEqual(30)
    })

    it('returns null for empty array', () => {
      expect(TimeWithZone.min()).toBeNull()
    })
  })

  describe('.max', () => {
    it('returns the later time', () => {
      const time1 = TimeWithZone.fromObject({ hour: 10, minute: 30 })
      const time2 = TimeWithZone.fromObject({ hour: 14, minute: 45 })
      const max = TimeWithZone.max(time1, time2)
      expect(max?.hour).toEqual(14)
      expect(max?.minute).toEqual(45)
    })

    it('returns null for empty array', () => {
      expect(TimeWithZone.max()).toBeNull()
    })
  })

  describe('#diff', () => {
    context('when the time is greater than the other time', () => {
      it('returns positive difference in the specified units', () => {
        const time1 = TimeWithZone.fromObject({ hour: 14, minute: 45 })
        const time2 = TimeWithZone.fromObject({ hour: 10, minute: 30 })
        expect(time1.diff(time2, 'hours')).toBeCloseTo(4.25, 1)
        expect(time1.diff(time2, 'minutes')).toEqual(255)
      })
    })

    context('when the time is less than the other time', () => {
      it('returns negative difference in the specified units', () => {
        const time1 = TimeWithZone.fromObject({ hour: 10, minute: 30 })
        const time2 = TimeWithZone.fromObject({ hour: 14, minute: 45 })
        expect(time1.diff(time2, 'hours')).toBeCloseTo(-4.25, 1)
        expect(time1.diff(time2, 'minutes')).toEqual(-255)
      })
    })
  })

  describe('#diffNow', () => {
    context('when the time is in the future', () => {
      it('returns positive difference', () => {
        const future = TimeWithZone.now().plus({ hours: 2 })
        const diff = future.diffNow('hours')
        expect(diff).toBeGreaterThan(1.9)
        expect(diff).toBeLessThan(2.1)
      })
    })

    context('when the time is in the past', () => {
      it('returns negative difference', () => {
        const past = TimeWithZone.now().minus({ hours: 2 })
        const diff = past.diffNow('hours')
        expect(diff).toBeLessThan(-1.9)
        expect(diff).toBeGreaterThan(-2.1)
      })
    })
  })

  describe('#equals', () => {
    context('when times are equal', () => {
      it('returns true', () => {
        const time1 = TimeWithZone.fromObject({ hour: 10, minute: 30, second: 45 })
        const time2 = TimeWithZone.fromObject({ hour: 10, minute: 30, second: 45 })
        expect(time1.equals(time2)).toBe(true)
      })
    })

    context('when times are not equal', () => {
      it('returns false', () => {
        const time1 = TimeWithZone.fromObject({ hour: 10, minute: 30 })
        const time2 = TimeWithZone.fromObject({ hour: 10, minute: 31 })
        expect(time1.equals(time2)).toBe(false)
      })
    })
  })

  describe('#setZone', () => {
    it('converts the time to a different timezone', () => {
      const timeUTC = TimeWithZone.fromObject({ hour: 10, minute: 30 }, { zone: 'UTC' })
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
        const time1 = TimeWithZone.fromObject({ hour: 10, minute: 30, second: 15 })
        const time2 = TimeWithZone.fromObject({ hour: 10, minute: 30, second: 45 })
        expect(time1.hasSame(time2, 'hour')).toBe(true)
        expect(time1.hasSame(time2, 'minute')).toBe(true)
        expect(time1.hasSame(time2, 'second')).toBe(false)
      })
    })
  })

  describe('#startOf', () => {
    it('returns time at the start of the specified unit', () => {
      const time = TimeWithZone.fromObject({ hour: 10, minute: 30, second: 45, millisecond: 123 })
      const startOfHour = time.startOf('hour')
      expect(startOfHour.hour).toEqual(10)
      expect(startOfHour.minute).toEqual(0)
      expect(startOfHour.second).toEqual(0)
      expect(startOfHour.millisecond).toEqual(0)
    })
  })

  describe('#endOf', () => {
    it('returns time at the end of the specified unit', () => {
      const time = TimeWithZone.fromObject({ hour: 10, minute: 30 })
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
        const time1 = TimeWithZone.fromObject({ hour: 10, minute: 30 })
        const time2 = TimeWithZone.fromObject({ hour: 14, minute: 45 })
        expect(time1 < time2).toBe(true)
        expect(time2 < time1).toBe(false)
      })
    })

    describe('>', () => {
      it('compares times correctly', () => {
        const time1 = TimeWithZone.fromObject({ hour: 10, minute: 30 })
        const time2 = TimeWithZone.fromObject({ hour: 14, minute: 45 })
        expect(time2 > time1).toBe(true)
        expect(time1 > time2).toBe(false)
      })
    })
  })
})
