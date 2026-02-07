import TimeWithoutZone, { InvalidTimeWithoutZone } from '../../../../src/utils/datetime/TimeWithoutZone.js'
import { DateTime } from '../../../../src/utils/datetime/DateTime.js'

describe('TimeWithoutZone', () => {
  describe('constructor', () => {
    context('without an argument', () => {
      it('sets itself to now (ignoring zone)', () => {
        const timeWithoutZone = new TimeWithoutZone()
        const now = TimeWithoutZone.now()
        // Allow 1 second tolerance for test execution time
        expect(Math.abs(timeWithoutZone.diff(now, 'seconds'))).toBeLessThan(1)
      })
    })

    context('with null', () => {
      it('sets itself to now (ignoring zone)', () => {
        const timeWithoutZone = new TimeWithoutZone(null)
        const now = TimeWithoutZone.now()
        // Allow 1 second tolerance for test execution time
        expect(Math.abs(timeWithoutZone.diff(now, 'seconds'))).toBeLessThan(1)
      })
    })

    context('with a valid DateTime', () => {
      it('sets its time components from the DateTime, ignoring zone', () => {
        const timeWithoutZone = new TimeWithoutZone(DateTime.fromISO('2024-02-29T14:30:45.123456Z'))
        expect(timeWithoutZone.toDateTime()?.isValid).toBe(true)
        expect(timeWithoutZone.toISOTime()).toEqual('14:30:45.123456')
        expect(timeWithoutZone.hour).toEqual(14)
        expect(timeWithoutZone.minute).toEqual(30)
      })
    })

    context('with a valid series of hour, minute, second, millisecond, microsecond numbers', () => {
      it('sets its DateTime to a valid DateTime', () => {
        const timeWithoutZone = new TimeWithoutZone(14, 30, 45, 123, 456)
        expect(timeWithoutZone.toDateTime()?.isValid).toBe(true)
        expect(timeWithoutZone.hour).toEqual(14)
        expect(timeWithoutZone.minute).toEqual(30)
        expect(timeWithoutZone.second).toEqual(45)
        expect(timeWithoutZone.millisecond).toEqual(123)
        expect(timeWithoutZone.microsecond).toEqual(456)
      })
    })

    context('with an invalid series of time numbers', () => {
      it('throws InvalidTimeWithoutZone', () => {
        expect(() => new TimeWithoutZone(25, 0, 0, 0, 0)).toThrow(InvalidTimeWithoutZone)
      })
    })
  })

  describe('.now', () => {
    it('creates a TimeWithoutZone for now (ignoring zone)', () => {
      const now = TimeWithoutZone.now()
      const dtNow = DateTime.now()
      expect(now.hour).toEqual(dtNow.hour)
      expect(now.minute).toEqual(dtNow.minute)
    })
  })

  describe('.fromDateTime', () => {
    it('creates a TimeWithoutZone from a DateTime instance', () => {
      const dateTime = DateTime.fromISO('2024-05-05T17:53:07.123456Z')
      const timeWithoutZone = TimeWithoutZone.fromDateTime(dateTime)
      expect(timeWithoutZone.toISOTime()).toEqual('17:53:07.123456')
      expect(timeWithoutZone.hour).toEqual(17)
      expect(timeWithoutZone.minute).toEqual(53)
    })

    it('extracts time components as they appear in the source DateTime', () => {
      // 17:53:07-05:00 is equivalent to 22:53:07 UTC
      // TimeWithoutZone extracts the actual hour/minute/second values from the DateTime
      const dateTimeNY = DateTime.fromISO('2024-05-05T17:53:07.123456-05:00')
      const timeWithoutZone = TimeWithoutZone.fromDateTime(dateTimeNY)
      // The DateTime's .hour property returns the hour in its own timezone
      expect(timeWithoutZone.hour).toEqual(dateTimeNY.hour)
      expect(timeWithoutZone.minute).toEqual(dateTimeNY.minute)
    })
  })

  describe('.fromJSDate', () => {
    it('creates a TimeWithoutZone from a JavaScript Date', () => {
      const javascriptDate = new Date('2024-05-05T01:53:07.123Z')
      const timeWithoutZone = TimeWithoutZone.fromJSDate(javascriptDate)
      expect(timeWithoutZone.hour).toEqual(1)
      expect(timeWithoutZone.minute).toEqual(53)
      expect(timeWithoutZone.second).toEqual(7)
    })
  })

  describe('.fromISO', () => {
    it('creates a TimeWithoutZone from an ISO string', () => {
      const timeWithoutZone = TimeWithoutZone.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(timeWithoutZone.hour).toEqual(10)
      expect(timeWithoutZone.minute).toEqual(30)
      expect(timeWithoutZone.second).toEqual(45)
      expect(timeWithoutZone.millisecond).toEqual(123)
      expect(timeWithoutZone.microsecond).toEqual(456)
    })

    context('with a time-only ISO string', () => {
      it('creates a TimeWithoutZone', () => {
        const timeWithoutZone = TimeWithoutZone.fromISO('10:30:45.123456')
        expect(timeWithoutZone.hour).toEqual(10)
        expect(timeWithoutZone.minute).toEqual(30)
        expect(timeWithoutZone.second).toEqual(45)
      })
    })

    context('with an invalid time string', () => {
      it('throws InvalidTimeWithoutZone', () => {
        expect(() => TimeWithoutZone.fromISO('25:00:00')).toThrow(InvalidTimeWithoutZone)
      })
    })
  })

  describe('.fromSQL', () => {
    it('creates a TimeWithoutZone from an SQL string', () => {
      const timeWithoutZone = TimeWithoutZone.fromSQL('2024-03-02 10:30:45.123456')
      expect(timeWithoutZone.hour).toEqual(10)
      expect(timeWithoutZone.minute).toEqual(30)
      expect(timeWithoutZone.second).toEqual(45)
    })

    context('with a time-only SQL string', () => {
      it('creates a TimeWithoutZone', () => {
        const timeWithoutZone = TimeWithoutZone.fromSQL('10:30:45.123456')
        expect(timeWithoutZone.hour).toEqual(10)
        expect(timeWithoutZone.minute).toEqual(30)
      })
    })

    context('with an invalid time string', () => {
      it('throws InvalidTimeWithoutZone', () => {
        expect(() => TimeWithoutZone.fromSQL('25:00:00')).toThrow(InvalidTimeWithoutZone)
      })
    })
  })

  describe('.fromFormat', () => {
    it('parses a time string with a format string', () => {
      const timeWithoutZone = TimeWithoutZone.fromFormat('10:30:45', 'HH:mm:ss')
      expect(timeWithoutZone.hour).toEqual(10)
      expect(timeWithoutZone.minute).toEqual(30)
      expect(timeWithoutZone.second).toEqual(45)
    })

    it('parses a time with milliseconds', () => {
      const timeWithoutZone = TimeWithoutZone.fromFormat('10:30:45.123', 'HH:mm:ss.SSS')
      expect(timeWithoutZone.hour).toEqual(10)
      expect(timeWithoutZone.minute).toEqual(30)
      expect(timeWithoutZone.second).toEqual(45)
      expect(timeWithoutZone.millisecond).toEqual(123)
    })

    it('parses and extracts time from the source', () => {
      // When parsing with timezone, the DateTime will have that timezone context
      const timeWithoutZone = TimeWithoutZone.fromFormat('10:30:45 -05:00', 'HH:mm:ss ZZ')
      // The parsed DateTime's hour property reflects its timezone
      const sourceDT = DateTime.fromFormat('10:30:45 -05:00', 'HH:mm:ss ZZ')
      expect(timeWithoutZone.hour).toEqual(sourceDT.hour)
      expect(timeWithoutZone.minute).toEqual(30)
      expect(timeWithoutZone.second).toEqual(45)
    })

    it('accepts locale option', () => {
      const timeWithoutZone = TimeWithoutZone.fromFormat('10:30 PM', 'hh:mm a', { locale: 'en-US' })
      expect(timeWithoutZone.hour).toEqual(22)
      expect(timeWithoutZone.minute).toEqual(30)
    })

    it('throws InvalidTimeWithoutZone when format does not match', () => {
      expect(() => TimeWithoutZone.fromFormat('not-matching', 'HH:mm:ss')).toThrow(InvalidTimeWithoutZone)
    })

    it('throws InvalidTimeWithoutZone when string is invalid for format', () => {
      expect(() => TimeWithoutZone.fromFormat('25:99:99', 'HH:mm:ss')).toThrow(InvalidTimeWithoutZone)
    })
  })

  describe('.fromObject', () => {
    it('creates a TimeWithoutZone from an object', () => {
      const timeWithoutZone = TimeWithoutZone.fromObject({
        hour: 14,
        minute: 30,
        second: 45,
        millisecond: 123,
      })
      expect(timeWithoutZone.hour).toEqual(14)
      expect(timeWithoutZone.minute).toEqual(30)
      expect(timeWithoutZone.second).toEqual(45)
      expect(timeWithoutZone.millisecond).toEqual(123)
    })

    context('with an invalid time', () => {
      it('throws InvalidTimeWithoutZone', () => {
        expect(() => TimeWithoutZone.fromObject({ hour: 25, minute: 0 })).toThrow(InvalidTimeWithoutZone)
      })
    })
  })

  describe('#toISOTime', () => {
    it('returns time in ISO format without zone offset', () => {
      const timeWithoutZone = TimeWithoutZone.fromObject({
        hour: 14,
        minute: 30,
        second: 45,
        millisecond: 123,
      })
      expect(timeWithoutZone.toISOTime()).toEqual('14:30:45.123000')
    })

    it('includes microseconds', () => {
      const timeWithoutZone = TimeWithoutZone.fromISO('14:30:45.123456')
      expect(timeWithoutZone.toISOTime()).toEqual('14:30:45.123456')
    })
  })

  describe('#toSQLTime', () => {
    it('returns time in SQL format without zone', () => {
      const timeWithoutZone = TimeWithoutZone.fromObject({
        hour: 14,
        minute: 30,
        second: 45,
        millisecond: 123,
      })
      expect(timeWithoutZone.toSQLTime()).toEqual('14:30:45.123000')
    })
  })

  describe('#toISO', () => {
    it('returns full ISO datetime string in UTC', () => {
      const timeWithoutZone = TimeWithoutZone.fromObject({ hour: 10, minute: 30, second: 45 })
      expect(timeWithoutZone.toISO()).toMatch(/T10:30:45\.000000Z/)
    })
  })

  describe('#toSQL', () => {
    it('returns full SQL datetime string', () => {
      const timeWithoutZone = TimeWithoutZone.fromObject({ hour: 10, minute: 30, second: 45 })
      expect(timeWithoutZone.toSQL()).toMatch(/10:30:45\.000000/)
    })
  })

  describe('#toJSON', () => {
    it('returns ISO time format', () => {
      const timeWithoutZone = TimeWithoutZone.fromObject({ hour: 10, minute: 30, second: 45 })
      expect(timeWithoutZone.toJSON()).toEqual(timeWithoutZone.toISOTime())
    })
  })

  describe('#valueOf', () => {
    it('returns ISO time string', () => {
      const timeWithoutZone = TimeWithoutZone.fromObject({ hour: 10, minute: 30, second: 45 })
      expect(timeWithoutZone.valueOf()).toEqual(timeWithoutZone.toISOTime())
    })
  })

  describe('#toLocaleString', () => {
    it('delegates to DateTime', () => {
      const timeWithoutZone = TimeWithoutZone.fromObject({ hour: 14, minute: 30, second: 45 })
      expect(timeWithoutZone.toLocaleString({ hour: 'numeric', minute: '2-digit' })).toMatch(/14:30|2:30/)
    })
  })

  describe('#toString', () => {
    it('returns ISO time format', () => {
      const timeWithoutZone = TimeWithoutZone.fromObject({ hour: 10, minute: 30, second: 45 })
      expect(timeWithoutZone.toString()).toEqual(timeWithoutZone.toISOTime())
    })
  })

  describe('#toDateTime', () => {
    it('returns the underlying DateTime instance', () => {
      const timeWithoutZone = TimeWithoutZone.fromObject({ hour: 10, minute: 30, second: 45 })
      const dateTime = timeWithoutZone.toDateTime()
      expect(dateTime.hour).toEqual(10)
      expect(dateTime.minute).toEqual(30)
      expect(dateTime.second).toEqual(45)
    })
  })

  describe('#toJSDate', () => {
    it('returns a JavaScript Date', () => {
      const timeWithoutZone = TimeWithoutZone.fromObject({ hour: 10, minute: 30, second: 45 })
      const jsDate = timeWithoutZone.toJSDate()
      expect(jsDate).toBeInstanceOf(Date)
    })
  })

  describe('#hour', () => {
    it('is the hour of the time', () => {
      const timeWithoutZone = TimeWithoutZone.fromObject({ hour: 14, minute: 30 })
      expect(timeWithoutZone.hour).toEqual(14)
    })
  })

  describe('#minute', () => {
    it('is the minute of the time', () => {
      const timeWithoutZone = TimeWithoutZone.fromObject({ hour: 14, minute: 30 })
      expect(timeWithoutZone.minute).toEqual(30)
    })
  })

  describe('#second', () => {
    it('is the second of the time', () => {
      const timeWithoutZone = TimeWithoutZone.fromObject({ hour: 14, minute: 30, second: 45 })
      expect(timeWithoutZone.second).toEqual(45)
    })
  })

  describe('#millisecond', () => {
    it('is the millisecond of the time', () => {
      const timeWithoutZone = TimeWithoutZone.fromObject({
        hour: 14,
        minute: 30,
        second: 45,
        millisecond: 123,
      })
      expect(timeWithoutZone.millisecond).toEqual(123)
    })
  })

  describe('#microsecond', () => {
    it('is the microsecond of the time', () => {
      const timeWithoutZone = TimeWithoutZone.fromISO('10:30:45.123456')
      expect(timeWithoutZone.microsecond).toEqual(456)
    })
  })

  describe('#plus', () => {
    it('adds time duration', () => {
      const timeWithoutZone = TimeWithoutZone.fromObject({ hour: 10, minute: 30 })
      const result = timeWithoutZone.plus({ hours: 2, minutes: 15 })
      expect(result.hour).toEqual(12)
      expect(result.minute).toEqual(45)
    })

    it('handles overflow into next day', () => {
      const timeWithoutZone = TimeWithoutZone.fromObject({ hour: 23, minute: 30 })
      const result = timeWithoutZone.plus({ hours: 1 })
      expect(result.hour).toEqual(0)
      expect(result.minute).toEqual(30)
    })
  })

  describe('#minus', () => {
    it('subtracts time duration', () => {
      const timeWithoutZone = TimeWithoutZone.fromObject({ hour: 12, minute: 45 })
      const result = timeWithoutZone.minus({ hours: 2, minutes: 15 })
      expect(result.hour).toEqual(10)
      expect(result.minute).toEqual(30)
    })

    it('handles underflow into previous day', () => {
      const timeWithoutZone = TimeWithoutZone.fromObject({ hour: 0, minute: 30 })
      const result = timeWithoutZone.minus({ hours: 1 })
      expect(result.hour).toEqual(23)
      expect(result.minute).toEqual(30)
    })
  })

  describe('.min', () => {
    it('returns the earlier time', () => {
      const time1 = TimeWithoutZone.fromObject({ hour: 10, minute: 30 })
      const time2 = TimeWithoutZone.fromObject({ hour: 14, minute: 45 })
      const min = TimeWithoutZone.min(time1, time2)
      expect(min?.hour).toEqual(10)
      expect(min?.minute).toEqual(30)
    })

    it('returns null for empty array', () => {
      expect(TimeWithoutZone.min()).toBeNull()
    })
  })

  describe('.max', () => {
    it('returns the later time', () => {
      const time1 = TimeWithoutZone.fromObject({ hour: 10, minute: 30 })
      const time2 = TimeWithoutZone.fromObject({ hour: 14, minute: 45 })
      const max = TimeWithoutZone.max(time1, time2)
      expect(max?.hour).toEqual(14)
      expect(max?.minute).toEqual(45)
    })

    it('returns null for empty array', () => {
      expect(TimeWithoutZone.max()).toBeNull()
    })
  })

  describe('#diff', () => {
    context('when the time is greater than the other time', () => {
      it('returns positive difference in the specified units', () => {
        const time1 = TimeWithoutZone.fromObject({ hour: 14, minute: 45 })
        const time2 = TimeWithoutZone.fromObject({ hour: 10, minute: 30 })
        expect(time1.diff(time2, 'hours')).toBeCloseTo(4.25, 1)
        expect(time1.diff(time2, 'minutes')).toEqual(255)
      })
    })

    context('when the time is less than the other time', () => {
      it('returns negative difference in the specified units', () => {
        const time1 = TimeWithoutZone.fromObject({ hour: 10, minute: 30 })
        const time2 = TimeWithoutZone.fromObject({ hour: 14, minute: 45 })
        expect(time1.diff(time2, 'hours')).toBeCloseTo(-4.25, 1)
        expect(time1.diff(time2, 'minutes')).toEqual(-255)
      })
    })
  })

  describe('#diffNow', () => {
    context('when the time is in the future', () => {
      it('returns positive difference', () => {
        const future = TimeWithoutZone.now().plus({ hours: 2 })
        const diff = future.diffNow('hours')
        expect(diff).toBeGreaterThan(1.9)
        expect(diff).toBeLessThan(2.1)
      })
    })

    context('when the time is in the past', () => {
      it('returns negative difference', () => {
        const past = TimeWithoutZone.now().minus({ hours: 2 })
        const diff = past.diffNow('hours')
        expect(diff).toBeLessThan(-1.9)
        expect(diff).toBeGreaterThan(-2.1)
      })
    })
  })

  describe('#equals', () => {
    context('when times are equal', () => {
      it('returns true', () => {
        const time1 = TimeWithoutZone.fromObject({ hour: 10, minute: 30, second: 45 })
        const time2 = TimeWithoutZone.fromObject({ hour: 10, minute: 30, second: 45 })
        expect(time1.equals(time2)).toBe(true)
      })
    })

    context('when times are not equal', () => {
      it('returns false', () => {
        const time1 = TimeWithoutZone.fromObject({ hour: 10, minute: 30 })
        const time2 = TimeWithoutZone.fromObject({ hour: 10, minute: 31 })
        expect(time1.equals(time2)).toBe(false)
      })
    })
  })

  describe('#hasSame', () => {
    context('when times share the same specified unit', () => {
      it('returns true', () => {
        const time1 = TimeWithoutZone.fromObject({ hour: 10, minute: 30, second: 15 })
        const time2 = TimeWithoutZone.fromObject({ hour: 10, minute: 30, second: 45 })
        expect(time1.hasSame(time2, 'hour')).toBe(true)
        expect(time1.hasSame(time2, 'minute')).toBe(true)
        expect(time1.hasSame(time2, 'second')).toBe(false)
      })
    })
  })

  describe('#startOf', () => {
    it('returns time at the start of the specified unit', () => {
      const time = TimeWithoutZone.fromObject({ hour: 10, minute: 30, second: 45, millisecond: 123 })
      const startOfHour = time.startOf('hour')
      expect(startOfHour.hour).toEqual(10)
      expect(startOfHour.minute).toEqual(0)
      expect(startOfHour.second).toEqual(0)
      expect(startOfHour.millisecond).toEqual(0)
    })
  })

  describe('#endOf', () => {
    it('returns time at the end of the specified unit', () => {
      const time = TimeWithoutZone.fromObject({ hour: 10, minute: 30 })
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
        const time1 = TimeWithoutZone.fromObject({ hour: 10, minute: 30 })
        const time2 = TimeWithoutZone.fromObject({ hour: 14, minute: 45 })
        expect(time1 < time2).toBe(true)
        expect(time2 < time1).toBe(false)
      })
    })

    describe('>', () => {
      it('compares times correctly', () => {
        const time1 = TimeWithoutZone.fromObject({ hour: 10, minute: 30 })
        const time2 = TimeWithoutZone.fromObject({ hour: 14, minute: 45 })
        expect(time2 > time1).toBe(true)
        expect(time1 > time2).toBe(false)
      })
    })
  })
})
