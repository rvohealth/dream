import ClockTime, { InvalidClockTime } from '../../../../src/utils/datetime/ClockTime.js'
import { DateTime } from '../../../../src/utils/datetime/DateTime.js'

describe('ClockTime', () => {
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

    context('with an invalid Date', () => {
      it('throws an error', () => {
        const invalidDate = new Date('invalid')
        expect(() => ClockTime.fromJSDate(invalidDate)).toThrow(InvalidClockTime)
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
      it('creates a ClockTime', () => {
        const clockTime = ClockTime.fromISO('10:30:45.123456')
        expect(clockTime.hour).toEqual(10)
        expect(clockTime.minute).toEqual(30)
        expect(clockTime.second).toEqual(45)
        expect(clockTime.millisecond).toEqual(123)
        expect(clockTime.microsecond).toEqual(456)
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
      expect(clockTime.millisecond).toEqual(123)
      expect(clockTime.microsecond).toEqual(456)
    })

    context('with a time-only SQL string', () => {
      it('creates a ClockTime', () => {
        const clockTime = ClockTime.fromSQL('10:30:45.123456')
        expect(clockTime.hour).toEqual(10)
        expect(clockTime.minute).toEqual(30)
        expect(clockTime.second).toEqual(45)
        expect(clockTime.millisecond).toEqual(123)
        expect(clockTime.microsecond).toEqual(456)
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

    it('parses fractional seconds with S token (milliseconds only)', () => {
      const clockTime = ClockTime.fromFormat('10:30:45.123', 'HH:mm:ss.SSS')
      expect(clockTime.millisecond).toEqual(123)
      expect(clockTime.microsecond).toEqual(0)
    })

    it('parses 6-digit fractional seconds with microseconds using u token', () => {
      const clockTime = ClockTime.fromFormat('10:30:45.123456', 'HH:mm:ss.u')
      expect(clockTime.millisecond).toEqual(123)
      expect(clockTime.microsecond).toEqual(456)
    })

    it('parses 6-digit fractional seconds with microseconds using SSSSSS token', () => {
      const clockTime = ClockTime.fromFormat('10:30:45.123456', 'HH:mm:ss.SSSSSS')
      expect(clockTime.millisecond).toEqual(123)
      expect(clockTime.microsecond).toEqual(456)
    })

    it('pads short fractional parts when using u token', () => {
      const clockTime = ClockTime.fromFormat('10:30:45.12', 'HH:mm:ss.u')
      expect(clockTime.millisecond).toEqual(120)
      expect(clockTime.microsecond).toEqual(0)
    })

    it('truncates long fractional parts when using u token', () => {
      const clockTime = ClockTime.fromFormat('10:30:45.1234567890', 'HH:mm:ss.u')
      expect(clockTime.millisecond).toEqual(123)
      expect(clockTime.microsecond).toEqual(456)
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
      const clockTime = ClockTime.fromObject({
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

    context('with an invalid time', () => {
      it('throws InvalidClockTime for invalid hour', () => {
        expect(() => ClockTime.fromObject({ hour: 25, minute: 0 })).toThrow(InvalidClockTime)
      })

      it('throws InvalidClockTime for invalid minute', () => {
        expect(() => ClockTime.fromObject({ hour: 10, minute: 60 })).toThrow(InvalidClockTime)
      })

      it('throws InvalidClockTime for invalid second', () => {
        expect(() => ClockTime.fromObject({ hour: 10, minute: 30, second: 60 })).toThrow(InvalidClockTime)
      })

      it('throws InvalidClockTime for invalid millisecond', () => {
        expect(() => ClockTime.fromObject({ hour: 10, minute: 30, millisecond: 1000 })).toThrow(
          InvalidClockTime
        )
      })

      it('throws InvalidClockTime for negative hour', () => {
        expect(() => ClockTime.fromObject({ hour: -1, minute: 0 })).toThrow(InvalidClockTime)
      })

      it('throws InvalidClockTime for negative minute', () => {
        expect(() => ClockTime.fromObject({ hour: 10, minute: -1 })).toThrow(InvalidClockTime)
      })
    })
  })

  describe('#toISOTime', () => {
    it('always strips timezone offset', () => {
      const clockTime = ClockTime.fromObject({ hour: 14, minute: 30, second: 45, millisecond: 123 })
      expect(clockTime.toISOTime()).toBe('14:30:45.123000')
    })

    it('strips timezone offset even when input has one', () => {
      const clockTime = ClockTime.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.toISOTime()).toBe('10:30:45.123456')
    })
  })

  describe('#toISO', () => {
    it('always strips timezone offset', () => {
      const clockTime = ClockTime.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.toISO()).toBe('10:30:45.123456')
    })

    it('strips timezone offset from different zones', () => {
      const clockTime = ClockTime.fromISO('2024-03-02T10:30:45.123456+03:00')
      expect(clockTime.toISO()).toBe('10:30:45.123456')
    })
  })

  describe('#toSQL', () => {
    it('always strips timezone offset', () => {
      const clockTime = ClockTime.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.toSQL()).toBe('10:30:45.123456')
    })
  })

  describe('#toSQLTime', () => {
    it('always strips timezone offset', () => {
      const clockTime = ClockTime.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.toSQLTime()).toBe('10:30:45.123456')
    })
  })

  describe('#toJSON', () => {
    it('always strips timezone offset', () => {
      const clockTime = ClockTime.fromISO('2024-03-02T10:30:45.123456-05:00')
      expect(clockTime.toJSON()).toBe('10:30:45.123456')
    })
  })

  describe('#valueOf', () => {
    it('always strips timezone offset', () => {
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
      expect(ClockTime.min(time1, time2)).toEqualClockTime(time1)
    })

    it('returns null for empty array', () => {
      expect(ClockTime.min()).toBeNull()
    })
  })

  describe('.max', () => {
    it('returns the later time', () => {
      const time1 = ClockTime.fromObject({ hour: 10, minute: 30 })
      const time2 = ClockTime.fromObject({ hour: 14, minute: 45 })
      expect(ClockTime.max(time1, time2)).toEqualClockTime(time2)
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
      const time = ClockTime.fromObject({
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
      const time = ClockTime.fromObject({ hour: 10, minute: 30 })
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
      const time = ClockTime.fromObject({ hour: 10, minute: 30, second: 45 })
      const updated = time.set({ hour: 14 })
      expect(updated.hour).toEqual(14)
      expect(updated.minute).toEqual(30)
      expect(updated.second).toEqual(45)
    })

    it('sets multiple time units', () => {
      const time = ClockTime.fromObject({ hour: 10, minute: 30, second: 45 })
      const updated = time.set({ hour: 14, minute: 15, second: 20 })
      expect(updated.hour).toEqual(14)
      expect(updated.minute).toEqual(15)
      expect(updated.second).toEqual(20)
    })

    it('sets microsecond', () => {
      const time = ClockTime.fromISO('2024-03-02T10:30:45.123456')
      const updated = time.set({ microsecond: 500 })
      expect(updated.toISOTime()).toBe('10:30:45.123500')
      expect(updated.microsecond).toEqual(500)
    })

    it('normalizes microsecond > 999 into milliseconds and remainder', () => {
      const time = ClockTime.fromISO('2024-03-02T10:30:45.077000')
      const updated = time.set({ microsecond: 1500 })
      expect(updated.millisecond).toEqual(78)
      expect(updated.microsecond).toEqual(500)
    })

    it('does not mutate the original ClockTime', () => {
      const time = ClockTime.fromObject({ hour: 10, minute: 30 })
      time.set({ hour: 14 })
      expect(time.hour).toEqual(10)
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
