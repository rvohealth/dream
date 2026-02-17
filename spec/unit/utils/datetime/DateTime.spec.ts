import { DateTime as LuxonDateTime } from 'luxon'
import sort from '../../../../src/helpers/sort.js'
import { DateTime, InvalidDateTime } from '../../../../src/utils/datetime/DateTime.js'

describe('DateTime', () => {
  describe('now', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-07T09:03:44.000Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns the current time', () => {
      const now = DateTime.now()
      expect(now).toBeInstanceOf(DateTime)
      expect(now.year).toEqual(2026)
      expect(now.month).toEqual(2)
      expect(now.day).toEqual(7)
      expect(now.hour).toEqual(9)
      expect(now.minute).toEqual(3)
      expect(now.second).toEqual(44)
    })
  })

  describe('fromObject', () => {
    it('supports microsecond in the object', () => {
      const datetime = DateTime.fromObject({
        year: 2026,
        month: 2,
        day: 7,
        hour: 9,
        minute: 3,
        second: 44,
        millisecond: 77,
        microsecond: 1,
      })
      expect(datetime.microsecond).toEqual(1)
      expect(datetime.toISO()).toEqual('2026-02-07T09:03:44.077001Z')
    })

    it('defaults microsecond to 0 when not provided', () => {
      const datetime = DateTime.fromObject(
        {
          year: 2026,
          month: 2,
          day: 7,
          hour: 9,
          minute: 3,
          second: 44,
          millisecond: 77,
        },
        { zone: 'utc' }
      )
      expect(datetime.toISO()).toEqual('2026-02-07T09:03:44.077000Z')
      expect(datetime.microsecond).toEqual(0)
    })

    it('throws InvalidDateTime when microsecond is less than 0', () => {
      expect(() =>
        DateTime.fromObject({
          year: 2026,
          month: 2,
          day: 7,
          microsecond: -1,
        })
      ).toThrow(InvalidDateTime)
    })

    it('normalizes microsecond > 999 into milliseconds and remainder', () => {
      const datetime = DateTime.fromObject({
        year: 2026,
        month: 2,
        day: 7,
        hour: 9,
        minute: 3,
        second: 44,
        millisecond: 77,
        microsecond: 1500,
      })
      expect(datetime.millisecond).toEqual(78)
      expect(datetime.microsecond).toEqual(500)
    })

    it('normalizes microsecond 1000 to 1ms and 0µs', () => {
      const datetime = DateTime.fromObject({
        year: 2026,
        month: 2,
        day: 7,
        millisecond: 100,
        microsecond: 1000,
      })
      expect(datetime.millisecond).toEqual(101)
      expect(datetime.microsecond).toEqual(0)
    })

    it('rounds decimal microseconds', () => {
      const datetime = DateTime.fromObject({
        year: 2026,
        month: 2,
        day: 7,
        microsecond: 1.5,
      })

      expect(datetime.microsecond).toEqual(2)
    })

    it('handles fractional milliseconds by converting to microseconds', () => {
      const datetime = DateTime.fromObject({
        year: 2026,
        month: 2,
        day: 7,
        hour: 9,
        minute: 3,
        second: 44,
        millisecond: 1.5,
      })
      expect(datetime.millisecond).toEqual(1)
      expect(datetime.microsecond).toEqual(500)
      expect(datetime.toISO()).toEqual('2026-02-07T09:03:44.001500Z')
    })

    it('combines fractional milliseconds with microseconds', () => {
      const datetime = DateTime.fromObject({
        year: 2026,
        month: 2,
        day: 7,
        millisecond: 2.5,
        microsecond: 250,
      })
      expect(datetime.millisecond).toEqual(2)
      expect(datetime.microsecond).toEqual(750)
    })

    it('handles fractional milliseconds with overflow', () => {
      const datetime = DateTime.fromObject({
        year: 2026,
        month: 2,
        day: 7,
        hour: 9,
        minute: 3,
        second: 44,
        millisecond: 3.999,
      })
      expect(datetime.millisecond).toEqual(3)
      expect(datetime.microsecond).toEqual(999)
    })

    it('accepts a zone option and stores the correct date/time in that timezone', () => {
      const datetime = DateTime.fromObject(
        {
          year: 2026,
          month: 3,
          day: 15,
          hour: 23,
          minute: 30,
          second: 45,
          millisecond: 123,
          microsecond: 456,
        },
        { zone: 'America/New_York' }
      )
      expect(datetime.toISO()).toEqual('2026-03-15T23:30:45.123456-04:00')
      expect(datetime.toUTC().toISO()).toEqual('2026-03-16T03:30:45.123456Z')
    })

    it('throws InvalidDateTime when calendar/date values are invalid', () => {
      expect(() =>
        DateTime.fromObject({
          year: 2026,
          month: 13,
          day: 1,
        })
      ).toThrow(InvalidDateTime)
    })
  })

  describe('fromISO', () => {
    it('parses fractional part into millisecond and microsecond (6 digits)', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.077001Z')
      expect(datetime.millisecond).toEqual(77)
      expect(datetime.microsecond).toEqual(1)
      expect(datetime.toISO()).toEqual('2026-02-07T09:03:44.077001Z')
    })

    it('parses 3-digit fractional part as milliseconds only (microseconds 0)', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.123Z')
      expect(datetime.millisecond).toEqual(123)
      expect(datetime.microsecond).toEqual(0)
      expect(datetime.toISO()).toEqual('2026-02-07T09:03:44.123000Z')
    })

    it('parses 1-digit fractional part (pads to ms, microseconds 0)', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.1')
      expect(datetime.millisecond).toEqual(100)
      expect(datetime.microsecond).toEqual(0)
    })

    it('parses ISO with no fractional part (microseconds 0)', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44')
      expect(datetime.microsecond).toEqual(0)
    })

    it('parses date-only ISO (microseconds 0)', () => {
      const datetime = DateTime.fromISO('2026-02-07')
      expect(datetime.microsecond).toEqual(0)
    })

    it('throws InvalidDateTime when ISO string is invalid', () => {
      expect(() => DateTime.fromISO('not-a-date')).toThrow(InvalidDateTime)
    })
  })

  describe('fromSQL', () => {
    it('parses fractional part into millisecond and microsecond', () => {
      const datetime = DateTime.fromSQL('2026-02-07 09:03:44.077001')
      expect(datetime.millisecond).toEqual(77)
      expect(datetime.microsecond).toEqual(1)
    })

    it('parses 3-digit fractional as ms only', () => {
      const datetime = DateTime.fromSQL('2026-02-07 09:03:44.123')
      expect(datetime.millisecond).toEqual(123)
      expect(datetime.microsecond).toEqual(0)
    })
  })

  describe('fromFormat', () => {
    it('parses a date string with a format string', () => {
      const datetime = DateTime.fromFormat('12/15/2017', 'MM/dd/yyyy')
      expect(datetime.year).toEqual(2017)
      expect(datetime.month).toEqual(12)
      expect(datetime.day).toEqual(15)
    })

    it('parses a datetime string with time components', () => {
      const datetime = DateTime.fromFormat('12/15/2017 10:30:45', 'MM/dd/yyyy HH:mm:ss')
      expect(datetime.year).toEqual(2017)
      expect(datetime.month).toEqual(12)
      expect(datetime.day).toEqual(15)
      expect(datetime.hour).toEqual(10)
      expect(datetime.minute).toEqual(30)
      expect(datetime.second).toEqual(45)
    })

    it('parses fractional seconds with S token (milliseconds only)', () => {
      const datetime = DateTime.fromFormat('12/15/2017 10:30:45.123', 'MM/dd/yyyy HH:mm:ss.SSS')
      expect(datetime.millisecond).toEqual(123)
      expect(datetime.microsecond).toEqual(0)
    })

    it('parses 6-digit fractional seconds with microseconds using u token', () => {
      const datetime = DateTime.fromFormat('12/15/2017 10:30:45.123456', 'MM/dd/yyyy HH:mm:ss.u')
      expect(datetime.millisecond).toEqual(123)
      expect(datetime.microsecond).toEqual(456)
    })

    it('parses 6-digit fractional seconds with microseconds using SSSSSS token', () => {
      const datetime = DateTime.fromFormat('12/15/2017 10:30:45.123456', 'MM/dd/yyyy HH:mm:ss.SSSSSS')
      expect(datetime.millisecond).toEqual(123)
      expect(datetime.microsecond).toEqual(456)
    })

    it('pads short fractional parts when using u token', () => {
      const datetime = DateTime.fromFormat('12/15/2017 10:30:45.12', 'MM/dd/yyyy HH:mm:ss.u')
      expect(datetime.millisecond).toEqual(120)
      expect(datetime.microsecond).toEqual(0)
    })

    it('truncates long fractional parts when using u token', () => {
      const datetime = DateTime.fromFormat('12/15/2017 10:30:45.1234567890', 'MM/dd/yyyy HH:mm:ss.u')
      expect(datetime.millisecond).toEqual(123)
      expect(datetime.microsecond).toEqual(456)
    })

    context('with zone option and timezone in format', () => {
      it('can change the datetime from the one specified in the format to the one specified in the optoin', () => {
        const date1 = DateTime.fromFormat('12/15/2017 02:00:00 +00:00', 'MM/dd/yyyy HH:mm:ss ZZ', {
          zone: 'America/New_York',
        })
        expect(date1.toISO()).toEqual('2017-12-14T21:00:00.000000-05:00')
        expect(date1.toUTC().toISO()).toEqual('2017-12-15T02:00:00.000000Z')

        const date2 = DateTime.fromFormat('12/14/2017 21:00:00 -05:00', 'MM/dd/yyyy HH:mm:ss ZZ', {
          zone: 'UTC',
        })
        expect(date2.toISO()).toEqual('2017-12-15T02:00:00.000000Z')
      })
    })

    it('accepts locale option', () => {
      const datetime = DateTime.fromFormat('mai 25, 1982', 'MMMM dd, yyyy', { locale: 'fr' })
      expect(datetime.year).toEqual(1982)
      expect(datetime.month).toEqual(5)
      expect(datetime.day).toEqual(25)
    })

    it('parses AM/PM format', () => {
      const datetime = DateTime.fromFormat('12/15/2017 10:30:45 PM', 'MM/dd/yyyy hh:mm:ss a')
      expect(datetime.hour).toEqual(22)
      expect(datetime.minute).toEqual(30)
      expect(datetime.second).toEqual(45)
    })

    it('throws InvalidDateTime when format does not match', () => {
      expect(() => DateTime.fromFormat('not-matching', 'MM/dd/yyyy')).toThrow(InvalidDateTime)
    })

    it('throws InvalidDateTime when string is invalid for format', () => {
      expect(() => DateTime.fromFormat('13/45/2017', 'MM/dd/yyyy')).toThrow(InvalidDateTime)
    })

    it('handles formats without fractional seconds (microseconds default to 0)', () => {
      const datetime = DateTime.fromFormat('12/15/2017 10:30:45', 'MM/dd/yyyy HH:mm:ss')
      expect(datetime.microsecond).toEqual(0)
      expect(datetime.millisecond).toEqual(0)
    })
  })

  describe('fromMillis', () => {
    it('returns DateTime with microseconds 0', () => {
      const datetime = DateTime.fromMillis(1707282224077)
      expect(datetime.toISO()).toEqual('2024-02-07T05:03:44.077000Z')
      expect(datetime.microsecond).toEqual(0)
    })

    it('converts decimal part of milliseconds to microseconds', () => {
      // .001 milliseconds = 1 microsecond
      const datetime1 = DateTime.fromMillis(1707282224077.001)
      expect(datetime1.millisecond).toEqual(77)
      expect(datetime1.microsecond).toEqual(1)
      expect(datetime1.toISO()).toEqual('2024-02-07T05:03:44.077001Z')

      // .456 milliseconds = 456 microseconds
      const datetime2 = DateTime.fromMillis(1707282224077.456)
      expect(datetime2.millisecond).toEqual(77)
      expect(datetime2.microsecond).toEqual(456)
      expect(datetime2.toISO()).toEqual('2024-02-07T05:03:44.077456Z')

      // .999 milliseconds = 999 microseconds
      const datetime3 = DateTime.fromMillis(1707282224077.999)
      expect(datetime3.millisecond).toEqual(77)
      expect(datetime3.microsecond).toEqual(999)
      expect(datetime3.toISO()).toEqual('2024-02-07T05:03:44.077999Z')
    })
  })

  describe('fromMicroseconds', () => {
    it('creates a DateTime from epoch microseconds', () => {
      const datetime = DateTime.fromMicroseconds(1707282224077001)
      expect(datetime.toISO()).toEqual('2024-02-07T05:03:44.077001Z')
      expect(datetime.microsecond).toEqual(1)
    })

    it('rounds microseconds', () => {
      const datetime = DateTime.fromMicroseconds(1707282224077001.5)
      expect(datetime.toISO()).toEqual('2024-02-07T05:03:44.077002Z')
      expect(datetime.microsecond).toEqual(2)
    })

    it('accepts optional zone options', () => {
      const microseconds = 1707282224077001 // 2024-02-07T05:03:44.077001Z in UTC

      // Test UTC
      const datetimeUTC = DateTime.fromMicroseconds(microseconds, { zone: 'UTC' })
      expect(datetimeUTC.zoneName).toEqual('UTC')
      expect(datetimeUTC.microsecond).toEqual(1)
      expect(datetimeUTC.toISO()).toEqual('2024-02-07T05:03:44.077001Z')

      // Test America/New_York (EST/EDT, UTC-5/-4)
      const datetimeNY = DateTime.fromMicroseconds(microseconds, {
        zone: 'America/New_York',
      })
      expect(datetimeNY.zoneName).toEqual('America/New_York')
      expect(datetimeNY.microsecond).toEqual(1)
      expect(datetimeNY.toISO()).toEqual('2024-02-07T00:03:44.077001-05:00')
      expect(datetimeNY.toUTC().toISO()).toEqual('2024-02-07T05:03:44.077001Z')
      expect(datetimeNY.year).toEqual(2024)
      expect(datetimeNY.month).toEqual(2)
      expect(datetimeNY.day).toEqual(7)
      expect(datetimeNY.hour).toEqual(0) // Midnight in NY

      // Test Asia/Tokyo (JST, UTC+9)
      const datetimeTokyo = DateTime.fromMicroseconds(microseconds, { zone: 'Asia/Tokyo' })
      expect(datetimeTokyo.zoneName).toEqual('Asia/Tokyo')
      expect(datetimeTokyo.microsecond).toEqual(1)
      expect(datetimeTokyo.toUTC().toISO()).toEqual('2024-02-07T05:03:44.077001Z')
      expect(datetimeTokyo.hour).toEqual(14) // 2 PM in Tokyo

      // Verify all three represent the same instant
      expect(datetimeUTC.toMicroseconds()).toEqual(microseconds)
      expect(datetimeNY.toMicroseconds()).toEqual(microseconds)
      expect(datetimeTokyo.toMicroseconds()).toEqual(microseconds)
    })
  })

  describe('fromSeconds', () => {
    it('handles fractional seconds by converting to milliseconds and microseconds', () => {
      const datetime1 = DateTime.fromSeconds(1707282224.077)
      expect(datetime1.toISO()).toEqual('2024-02-07T05:03:44.077000Z')
      expect(datetime1.microsecond).toEqual(0)

      const datetime2 = DateTime.fromSeconds(1707282224.077654)
      expect(datetime2.toISO()).toEqual('2024-02-07T05:03:44.077654Z')
      expect(datetime2.microsecond).toEqual(654)
    })
  })

  describe('fromJSDate', () => {
    it('returns DateTime with microseconds 0', () => {
      const datetime = DateTime.fromJSDate(new Date('2026-02-07T09:03:44.077Z'))
      expect(datetime.toISO()).toEqual('2026-02-07T09:03:44.077000Z')
      expect(datetime.microsecond).toEqual(0)
    })
  })

  describe('local', () => {
    it('supports microsecond as 8th argument', () => {
      const datetime = DateTime.local(2026, 2, 7, 9, 3, 44, 77, 1, { zone: 'utc' })
      expect(datetime.microsecond).toEqual(1)
      expect(datetime.toISO()).toEqual('2026-02-07T09:03:44.077001Z')
    })

    it('accepts microsecond as 8th argument and produces correct toISO', () => {
      const datetime = DateTime.local(2026, 2, 7, 9, 3, 44, 77, 1, { zone: 'utc' })
      expect(datetime.toISO()).toEqual('2026-02-07T09:03:44.077001Z')
      expect(datetime.microsecond).toEqual(1)
    })

    it('defaults microsecond to 0 when not provided', () => {
      const datetime = DateTime.local(2026, 2, 7, 9, 3, 44, 77)
      expect(datetime.microsecond).toEqual(0)
    })

    it('normalizes microsecond > 999 into milliseconds and remainder', () => {
      const datetime = DateTime.local(2026, 2, 7, 9, 3, 44, 77, 1500, { zone: 'utc' })
      expect(datetime.millisecond).toEqual(78)
      expect(datetime.microsecond).toEqual(500)
    })
  })

  describe('utc', () => {
    it('accepts microsecond as 8th argument', () => {
      const datetime = DateTime.utc(2026, 2, 7, 9, 3, 44, 77, 1)
      expect(datetime.toISO()).toEqual('2026-02-07T09:03:44.077001Z')
      expect(datetime.microsecond).toEqual(1)
    })

    it('normalizes microsecond > 999 into milliseconds and remainder', () => {
      const datetime = DateTime.utc(2026, 2, 7, 9, 3, 44, 77, 1500)
      expect(datetime.millisecond).toEqual(78)
      expect(datetime.microsecond).toEqual(500)
    })
  })

  describe('toISO', () => {
    it('outputs 6 decimal places (millisecond + microsecond)', () => {
      const datetime = DateTime.fromObject(
        {
          year: 2026,
          month: 2,
          day: 7,
          hour: 9,
          minute: 3,
          second: 44,
          millisecond: 77,
          microsecond: 1,
        },
        { zone: 'utc' }
      )
      expect(datetime.toISO()).toEqual('2026-02-07T09:03:44.077001Z')
    })

    it('pads microsecond to 3 digits', () => {
      const datetime = DateTime.fromObject(
        {
          year: 2026,
          month: 2,
          day: 7,
          hour: 9,
          minute: 3,
          second: 44,
          millisecond: 0,
          microsecond: 1,
        },
        { zone: 'utc' }
      )
      expect(datetime.toISO()).toEqual('2026-02-07T09:03:44.000001Z')
    })

    context('with suppressMilliseconds option', () => {
      context('when milliseconds is non-zero and microseconds are zero', () => {
        it('outputs 6 decimal places for sub-second part', () => {
          const datetime = DateTime.fromObject({
            year: 2026,
            month: 2,
            day: 7,
            hour: 0,
            minute: 0,
            second: 1,
            millisecond: 7,
            microsecond: 0,
          })
          expect(datetime.toISO({ suppressMilliseconds: true })).toEqual('2026-02-07T00:00:01.007000Z')
        })
      })

      context('when milliseconds are zero and microseconds are non-zero', () => {
        it('outputs 6 decimal places for sub-second part', () => {
          const datetime = DateTime.fromObject({
            year: 2026,
            month: 2,
            day: 7,
            hour: 0,
            minute: 0,
            second: 1,
            millisecond: 0,
            microsecond: 7,
          })
          expect(datetime.toISO({ suppressMilliseconds: true })).toEqual('2026-02-07T00:00:01.000007Z')
        })
      })

      context('when the milliseconds and microseconds are zero', () => {
        it('omits the milliseconds part', () => {
          const datetime = DateTime.fromObject({
            year: 2026,
            month: 2,
            day: 7,
            hour: 0,
            minute: 0,
            second: 1,
            millisecond: 0,
            microsecond: 0,
          })
          expect(datetime.toISO({ suppressMilliseconds: true })).toEqual('2026-02-07T00:00:01Z')
        })
      })
    })

    context('with truncateMicroseconds option', () => {
      it('outputs 3 decimal places when microseconds are present', () => {
        const datetime = DateTime.fromISO('2026-02-07T09:03:44.123456Z')
        expect(datetime.toISO({ truncateMicroseconds: true })).toEqual('2026-02-07T09:03:44.123Z')
      })

      it('outputs 3 decimal places when microseconds are zero', () => {
        const datetime = DateTime.fromISO('2026-02-07T09:03:44.123000Z')
        expect(datetime.toISO({ truncateMicroseconds: true })).toEqual('2026-02-07T09:03:44.123Z')
      })

      it('preserves leading zeros in milliseconds', () => {
        const datetime = DateTime.fromISO('2026-02-07T09:03:44.007456Z')
        expect(datetime.toISO({ truncateMicroseconds: true })).toEqual('2026-02-07T09:03:44.007Z')
      })

      it('outputs .000 when both milliseconds and microseconds are zero', () => {
        const datetime = DateTime.fromISO('2026-02-07T09:03:44.000000Z')
        expect(datetime.toISO({ truncateMicroseconds: true })).toEqual('2026-02-07T09:03:44.000Z')
      })

      it('suppressMilliseconds takes precedence over truncateMicroseconds when sub-second is zero', () => {
        const datetime = DateTime.fromObject({
          year: 2026,
          month: 2,
          day: 7,
          hour: 9,
          minute: 3,
          second: 44,
          millisecond: 0,
          microsecond: 0,
        })
        expect(datetime.toISO({ truncateMicroseconds: true, suppressMilliseconds: true })).toEqual(
          '2026-02-07T09:03:44Z'
        )
      })

      it('truncateMicroseconds still outputs 3 decimal places when suppressMilliseconds is true but milliseconds are non-zero', () => {
        const datetime = DateTime.fromISO('2026-02-07T09:03:44.123456Z')
        expect(datetime.toISO({ truncateMicroseconds: true, suppressMilliseconds: true })).toEqual(
          '2026-02-07T09:03:44.123Z'
        )
      })
    })
  })

  describe('toISOTime', () => {
    it('outputs 6 decimal places for fractional part', () => {
      const datetime = DateTime.fromObject(
        {
          year: 2026,
          month: 2,
          day: 7,
          hour: 9,
          minute: 3,
          second: 44,
          millisecond: 77,
          microsecond: 1,
        },
        { zone: 'utc' }
      )
      expect(datetime.toISOTime()).toEqual('09:03:44.077001')
    })

    context('with truncateMicroseconds option', () => {
      it('outputs 3 decimal places for fractional part', () => {
        const datetime = DateTime.fromObject(
          {
            year: 2026,
            month: 2,
            day: 7,
            hour: 9,
            minute: 3,
            second: 44,
            millisecond: 77,
            microsecond: 1,
          },
          { zone: 'utc' }
        )
        expect(datetime.toISOTime({ truncateMicroseconds: true })).toEqual('09:03:44.077')
      })
    })
  })

  describe('toMillis', () => {
    it('includes microseconds as fractional part', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.077750Z')
      expect(datetime.toMillis()).toEqual(1770455024077.75)
      expect(datetime.toMillis().toString()).toEqual('1770455024077.75')
    })
  })

  describe('toMicroseconds', () => {
    it('returns epoch microseconds equivalent to toMillis * 1000 + microseconds', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.077001Z')
      expect(datetime.toMicroseconds()).toEqual(1770455024077001)
    })

    it('round-trips with fromMicroseconds', () => {
      const epochMicros = 1707282224077501
      const datetime = DateTime.fromMicroseconds(epochMicros)
      expect(datetime.toMicroseconds()).toEqual(epochMicros)
    })
  })

  describe('toSeconds', () => {
    it('returns epoch seconds for datetime without fractional seconds', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.000000Z')
      expect(datetime.toSeconds()).toEqual(1770455024)
    })

    it('includes milliseconds in fractional part', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.123000Z')
      expect(datetime.toSeconds()).toEqual(1770455024.123)
    })

    it('includes microseconds in fractional part', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.123456Z')
      // 1770455024 + 0.123456
      expect(datetime.toSeconds()).toEqual(1770455024.123456)
    })

    it('handles datetime with only microseconds (no milliseconds)', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.000789Z')
      expect(datetime.toSeconds()).toEqual(1770455024.000789)
    })

    it('round-trips correctly with fromMicroseconds', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.987654Z')
      const seconds = datetime.toSeconds()
      const microseconds = Math.round(seconds * 1_000_000)
      const roundTripped = DateTime.fromMicroseconds(microseconds)
      expect(roundTripped).toEqualDateTime(datetime)
    })

    it('maintains precision for very precise timestamps', () => {
      const datetime = DateTime.fromMicroseconds(1770455024999999)
      const seconds = datetime.toSeconds()
      // Should be 1770455024.999999
      expect(seconds).toEqual(1770455024.999999)
    })
  })

  describe('unixIntegerSeconds', () => {
    it('returns integer epoch seconds for datetime without fractional seconds', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.000000Z')
      expect(datetime.unixIntegerSeconds).toEqual(1770455024)
    })

    it('truncates milliseconds from the result', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.123000Z')
      expect(datetime.unixIntegerSeconds).toEqual(1770455024)
    })

    it('truncates microseconds from the result', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.123456Z')
      expect(datetime.unixIntegerSeconds).toEqual(1770455024)
    })

    it('does not round up, always floors', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.999999Z')
      expect(datetime.unixIntegerSeconds).toEqual(1770455024)
      expect(datetime.unixIntegerSeconds).not.toEqual(1770455025)
    })

    it('handles datetime with only microseconds (no milliseconds)', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.000001Z')
      expect(datetime.unixIntegerSeconds).toEqual(1770455024)
    })

    it('is equivalent to Math.floor(toSeconds())', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.567890Z')
      expect(datetime.unixIntegerSeconds).toEqual(Math.floor(datetime.toSeconds()))
    })

    it('handles negative timestamps correctly', () => {
      const datetime = DateTime.fromISO('1969-12-31T23:59:59.999999Z')
      expect(datetime.unixIntegerSeconds).toEqual(Math.floor(datetime.toSeconds()))
      expect(datetime.unixIntegerSeconds).toBeLessThan(0)
    })

    it('works with very large timestamps', () => {
      const datetime = DateTime.fromISO('2099-12-31T23:59:59.123456Z')
      expect(datetime.unixIntegerSeconds).toEqual(Math.floor(datetime.toSeconds()))
    })

    it('returns consistent results for same second with different microseconds', () => {
      const dt1 = DateTime.fromISO('2026-02-07T09:03:44.000001Z')
      const dt2 = DateTime.fromISO('2026-02-07T09:03:44.500000Z')
      const dt3 = DateTime.fromISO('2026-02-07T09:03:44.999999Z')

      expect(dt1.unixIntegerSeconds).toEqual(1770455024)
      expect(dt2.unixIntegerSeconds).toEqual(1770455024)
      expect(dt3.unixIntegerSeconds).toEqual(1770455024)
    })

    it('differs by 1 for consecutive seconds', () => {
      const dt1 = DateTime.fromISO('2026-02-07T09:03:44.999999Z')
      const dt2 = DateTime.fromISO('2026-02-07T09:03:45.000000Z')

      expect(dt2.unixIntegerSeconds - dt1.unixIntegerSeconds).toEqual(1)
    })
  })

  describe('unixIntegerMilliseconds', () => {
    it('returns integer epoch milliseconds for datetime without fractional milliseconds', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.123000Z')
      expect(datetime.unixIntegerMilliseconds).toEqual(1770455024123)
    })

    it('truncates microseconds from the result', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.123456Z')
      expect(datetime.unixIntegerMilliseconds).toEqual(1770455024123)
    })

    it('does not round up, always floors', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.123999Z')
      expect(datetime.unixIntegerMilliseconds).toEqual(1770455024123)
      expect(datetime.unixIntegerMilliseconds).not.toEqual(1770455024124)
    })

    it('is equivalent to Math.floor(toMillis())', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.567890Z')
      expect(datetime.unixIntegerMilliseconds).toEqual(Math.floor(datetime.toMillis()))
    })

    it('returns consistent results for same millisecond with different microseconds', () => {
      const dt1 = DateTime.fromISO('2026-02-07T09:03:44.123001Z')
      const dt2 = DateTime.fromISO('2026-02-07T09:03:44.123500Z')
      const dt3 = DateTime.fromISO('2026-02-07T09:03:44.123999Z')

      expect(dt1.unixIntegerMilliseconds).toEqual(1770455024123)
      expect(dt2.unixIntegerMilliseconds).toEqual(1770455024123)
      expect(dt3.unixIntegerMilliseconds).toEqual(1770455024123)
    })

    it('differs by 1 for consecutive milliseconds', () => {
      const dt1 = DateTime.fromISO('2026-02-07T09:03:44.123999Z')
      const dt2 = DateTime.fromISO('2026-02-07T09:03:44.124000Z')

      expect(dt2.unixIntegerMilliseconds - dt1.unixIntegerMilliseconds).toEqual(1)
    })
  })

  describe('unixIntegerMicroseconds', () => {
    it('returns integer epoch microseconds', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.123456Z')
      expect(datetime.unixIntegerMicroseconds).toEqual(1770455024123456)
    })

    it('is equivalent to toMicroseconds()', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.567890Z')
      expect(datetime.unixIntegerMicroseconds).toEqual(datetime.toMicroseconds())
    })

    it('differs by 1 for consecutive microseconds', () => {
      const dt1 = DateTime.fromISO('2026-02-07T09:03:44.123456Z')
      const dt2 = DateTime.fromISO('2026-02-07T09:03:44.123457Z')

      expect(dt2.unixIntegerMicroseconds - dt1.unixIntegerMicroseconds).toEqual(1)
    })
  })

  describe('valueOf', () => {
    it('returns ISO datetime string', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.077001Z')
      expect(datetime.valueOf()).toEqual('2026-02-07T09:03:44.077001Z')
    })

    it('repeated calls return the same value', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.077001Z')
      expect(datetime.valueOf()).toEqual(datetime.valueOf())
    })

    it('includes full microsecond precision in the string', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.123456Z')
      expect(datetime.valueOf()).toEqual('2026-02-07T09:03:44.123456Z')
    })

    it('allows comparison operations', () => {
      const dt1 = DateTime.fromISO('2026-02-07T09:03:44.123456Z')
      const dt2 = DateTime.fromISO('2026-02-07T09:03:44.123457Z')
      expect(dt2 > dt1).toBe(true)
      expect(dt1 < dt2).toBe(true)
    })

    it('works with sort', () => {
      const dt1 = DateTime.fromISO('2026-02-07T09:03:44.000001Z')
      const dt2 = DateTime.fromISO('2026-02-07T09:03:44.000002Z')
      const dt3 = DateTime.fromISO('2026-02-07T09:03:44.000003Z')

      expect(sort([dt3, dt1, dt2])).toEqual([dt1, dt2, dt3])
    })

    it('round-trips with fromISO', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.987654Z')
      const iso = datetime.valueOf()
      const roundTripped = DateTime.fromISO(iso)
      expect(roundTripped).toEqualDateTime(datetime)
    })
  })

  describe('toLuxon', () => {
    it('returns the underlying Luxon DateTime instance', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.077001Z')
      const luxon = datetime.toLuxon()
      expect(luxon.year).toEqual(2026)
      expect(luxon.month).toEqual(2)
      expect(luxon.day).toEqual(7)
      expect(luxon.hour).toEqual(9)
      expect(luxon.minute).toEqual(3)
      expect(luxon.second).toEqual(44)
      expect(luxon.millisecond).toEqual(77)
    })
  })

  describe('plus', () => {
    it('supports microseconds in duration object', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.077001Z').plus({ microseconds: 100 })
      expect(datetime.microsecond).toEqual(101)
    })

    it('adds microseconds and handles overflow into milliseconds', () => {
      const dateTime1 = DateTime.fromISO('2026-02-07T09:03:44.007333')
      const dateTime2 = dateTime1.plus({ microseconds: 800 })
      expect(dateTime2.millisecond).toEqual(8)
      expect(dateTime2.microsecond).toEqual(133)
    })

    it('adds only microseconds when no overflow', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.077001').plus({ microseconds: 100 })
      expect(datetime.millisecond).toEqual(77)
      expect(datetime.microsecond).toEqual(101)
    })

    it('adds duration with multiple units including microseconds', () => {
      // 44.000001 + 1s = 45.000001, + 999µs = 45.001000 (overflow 1000µs -> 1ms)
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.000001').plus({ seconds: 1, microseconds: 999 })
      expect(datetime.second).toEqual(45)
      expect(datetime.millisecond).toEqual(1)
      expect(datetime.microsecond).toEqual(0)
    })

    it('handles fractional milliseconds by converting to microseconds', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.000000Z').plus({ milliseconds: 1.5 })
      expect(datetime.millisecond).toEqual(1)
      expect(datetime.microsecond).toEqual(500)
      expect(datetime.toISO()).toEqual('2026-02-07T09:03:44.001500Z')
    })

    it('combines fractional milliseconds with microseconds', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.001000Z').plus({
        milliseconds: 2.5,
        microseconds: 250,
      })
      expect(datetime.millisecond).toEqual(3)
      expect(datetime.microsecond).toEqual(750)
    })

    it('fractional milliseconds are equivalent to microseconds', () => {
      const base = DateTime.fromISO('2026-02-07T09:03:44.000000Z')
      const withFractional = base.plus({ milliseconds: 1.5 })
      const withMicroseconds = base.plus({ milliseconds: 1, microseconds: 500 })
      expect(withFractional).toEqualDateTime(withMicroseconds)
    })
  })

  describe('minus', () => {
    it('supports microseconds in duration object', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.077100Z').minus({ microseconds: 100 })
      expect(datetime.microsecond).toEqual(0)
    })

    it('subtracts microseconds and handles underflow', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.007133').minus({ microseconds: 800 })
      expect(datetime.millisecond).toEqual(6)
      expect(datetime.microsecond).toEqual(333)
    })

    it('handles fractional milliseconds by converting to microseconds', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.005000Z').minus({ milliseconds: 1.5 })
      expect(datetime.millisecond).toEqual(3)
      expect(datetime.microsecond).toEqual(500)
      expect(datetime.toISO()).toEqual('2026-02-07T09:03:44.003500Z')
    })

    it('combines fractional milliseconds with microseconds', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.010000Z').minus({
        milliseconds: 2.5,
        microseconds: 250,
      })
      expect(datetime.millisecond).toEqual(7)
      expect(datetime.microsecond).toEqual(250)
    })

    it('fractional milliseconds are equivalent to microseconds', () => {
      const base = DateTime.fromISO('2026-02-07T09:03:44.005000Z')
      const withFractional = base.minus({ milliseconds: 1.5 })
      const withMicroseconds = base.minus({ milliseconds: 1, microseconds: 500 })
      expect(withFractional).toEqualDateTime(withMicroseconds)
    })

    it('normalizes microseconds > 999 in duration into milliseconds and remainder', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.007000Z').minus({ microseconds: 1500 })
      expect(datetime.millisecond).toEqual(5)
      expect(datetime.microsecond).toEqual(500)
    })
  })

  describe('set', () => {
    it('supports microsecond in values', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.077001Z').set({ microsecond: 500 })
      expect(datetime.toISO()).toEqual('2026-02-07T09:03:44.077500Z')
      expect(datetime.microsecond).toEqual(500)
    })

    it('accepts microsecond and updates microseconds', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.077001').set({ microsecond: 500 })
      expect(datetime.toISO()).toEqual('2026-02-07T09:03:44.077500Z')
      expect(datetime.microsecond).toEqual(500)
    })

    it('normalizes microsecond > 999 into milliseconds and remainder', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.077000Z').set({ microsecond: 1500 })
      expect(datetime.toISO()).toEqual('2026-02-07T09:03:44.078500Z')
      expect(datetime.millisecond).toEqual(78)
      expect(datetime.microsecond).toEqual(500)
    })
  })

  describe('weekdayName', () => {
    it('returns monday for a Monday', () => {
      const datetime = DateTime.fromISO('2026-02-09T09:00:00Z') // Monday
      expect(datetime.weekdayName).toEqual('monday')
    })

    it('returns tuesday for a Tuesday', () => {
      const datetime = DateTime.fromISO('2026-02-10T09:00:00Z') // Tuesday
      expect(datetime.weekdayName).toEqual('tuesday')
    })

    it('returns wednesday for a Wednesday', () => {
      const datetime = DateTime.fromISO('2026-02-11T09:00:00Z') // Wednesday
      expect(datetime.weekdayName).toEqual('wednesday')
    })

    it('returns thursday for a Thursday', () => {
      const datetime = DateTime.fromISO('2026-02-12T09:00:00Z') // Thursday
      expect(datetime.weekdayName).toEqual('thursday')
    })

    it('returns friday for a Friday', () => {
      const datetime = DateTime.fromISO('2026-02-13T09:00:00Z') // Friday
      expect(datetime.weekdayName).toEqual('friday')
    })

    it('returns saturday for a Saturday', () => {
      const datetime = DateTime.fromISO('2026-02-14T09:00:00Z') // Saturday
      expect(datetime.weekdayName).toEqual('saturday')
    })

    it('returns sunday for a Sunday', () => {
      const datetime = DateTime.fromISO('2026-02-08T09:00:00Z') // Sunday
      expect(datetime.weekdayName).toEqual('sunday')
    })

    it('works across different time zones', () => {
      const utc = DateTime.fromISO('2026-02-09T09:00:00Z') // Monday in UTC
      const pacific = DateTime.fromISO('2026-02-09T09:00:00-08:00') // Monday in Pacific
      expect(utc.weekdayName).toEqual('monday')
      expect(pacific.weekdayName).toEqual('monday')
    })

    it('returns correct name regardless of time within the day', () => {
      const midnight = DateTime.fromISO('2026-02-09T00:00:00Z')
      const noon = DateTime.fromISO('2026-02-09T12:00:00Z')
      const endOfDay = DateTime.fromISO('2026-02-09T23:59:59.999999Z')

      expect(midnight.weekdayName).toEqual('monday')
      expect(noon.weekdayName).toEqual('monday')
      expect(endOfDay.weekdayName).toEqual('monday')
    })
  })

  describe('toObject', () => {
    it('includes microsecond in the result', () => {
      const datetime = DateTime.fromObject({
        year: 2026,
        month: 2,
        day: 7,
        hour: 13,
        minute: 25,
        second: 12,
        millisecond: 400,
        microsecond: 42,
      })
      const obj = datetime.toObject()
      expect(obj.year).toEqual(2026)
      expect(obj.month).toEqual(2)
      expect(obj.day).toEqual(7)
      expect(obj.hour).toEqual(13)
      expect(obj.minute).toEqual(25)
      expect(obj.second).toEqual(12)
      expect(obj.millisecond).toEqual(400)
      expect(obj.microsecond).toEqual(42)
    })
  })

  describe('equals', () => {
    it('returns true when same luxon timestamp and same microseconds', () => {
      const a = DateTime.fromISO('2026-02-07T09:03:44.077001')
      const b = DateTime.fromISO('2026-02-07T09:03:44.077001')
      expect(a.equals(b)).toEqual(true)
    })

    it('returns false when same luxon but different microseconds', () => {
      const a = DateTime.fromISO('2026-02-07T09:03:44.077001')
      const b = DateTime.fromISO('2026-02-07T09:03:44.077002')
      expect(a.equals(b)).toEqual(false)
    })
  })

  describe('min', () => {
    it('returns the minimum DateTime (comparison includes microseconds)', () => {
      const a = DateTime.fromISO('2026-02-07T09:03:44.077001Z')
      const b = DateTime.fromISO('2026-02-07T09:03:44.077002Z')
      const min = DateTime.min(a, b)!
      expect(min.equals(a)).toEqual(true)
      expect(DateTime.min(b, a)!.equals(a)).toEqual(true)
    })
  })

  describe('max', () => {
    it('returns the maximum DateTime (comparison includes microseconds)', () => {
      const a = DateTime.fromISO('2026-02-07T09:03:44.077001Z')
      const b = DateTime.fromISO('2026-02-07T09:03:44.077002Z')
      const max = DateTime.max(a, b)!
      expect(max.equals(b)).toEqual(true)
      expect(DateTime.max(b, a)!.equals(b)).toEqual(true)
    })
  })

  describe('InvalidDateTime', () => {
    it('wraps underlying error message', () => {
      try {
        DateTime.fromObject({ year: 2026, month: 13, day: 1 })
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidDateTime)
        expect((e as Error).message).toBeDefined()
      }
    })
  })

  describe('diff', () => {
    describe('with single unit argument', () => {
      it('returns difference in years', () => {
        const dt1 = DateTime.fromISO('2026-02-07T09:03:44.077001Z')
        const dt2 = DateTime.fromISO('2023-02-07T09:03:44.077001Z')
        const diff = dt1.diff(dt2, 'years')
        expect(diff).toEqual({ years: 3 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('returns difference in months', () => {
        const dt1 = DateTime.fromISO('2026-05-07T09:03:44Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:03:44Z')
        const diff = dt1.diff(dt2, 'months')
        expect(diff).toEqual({ months: 3 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('returns difference in quarters', () => {
        const dt1 = DateTime.fromISO('2026-11-07T09:03:44Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:03:44Z')
        const diff = dt1.diff(dt2, 'quarters')
        expect(diff).toEqual({ quarters: 3 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('returns difference in days', () => {
        const dt1 = DateTime.fromISO('2026-02-15T09:03:44Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:03:44Z')
        const diff = dt1.diff(dt2, 'days')
        expect(diff).toEqual({ days: 8 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('returns difference in hours', () => {
        const dt1 = DateTime.fromISO('2026-02-07T15:00:00Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:00:00Z')
        const diff = dt1.diff(dt2, 'hours')
        expect(diff).toEqual({ hours: 6 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('returns difference in minutes', () => {
        const dt1 = DateTime.fromISO('2026-02-07T09:45:00Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:15:00Z')
        const diff = dt1.diff(dt2, 'minutes')
        expect(diff).toEqual({ minutes: 30 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('returns difference in seconds', () => {
        const dt1 = DateTime.fromISO('2026-02-07T09:03:44Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:03:45Z')
        const diff = dt1.diff(dt2, 'seconds')
        expect(diff).toEqual({ seconds: -1 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('returns difference in milliseconds', () => {
        const dt1 = DateTime.fromISO('2026-02-07T09:03:44.500Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:03:44.000Z')
        const diff = dt1.diff(dt2, 'milliseconds')
        expect(diff).toEqual({ milliseconds: 500 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })
    })

    describe('with multiple units argument (array)', () => {
      it('returns difference in days and hours', () => {
        const dt1 = DateTime.fromISO('2026-02-09T15:30:00Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:30:00Z')
        const diff = dt1.diff(dt2, ['days', 'hours'])
        expect(diff).toEqual({ days: 2, hours: 6 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('returns difference in hours, minutes, and seconds', () => {
        const dt1 = DateTime.fromISO('2026-02-07T12:45:30Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:15:10Z')
        const diff = dt1.diff(dt2, ['hours', 'minutes', 'seconds'])
        expect(diff).toEqual({ hours: 3, minutes: 30, seconds: 20 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('returns difference in years, weeks, and days', () => {
        const dt1 = DateTime.fromISO('2028-05-20T09:00:00Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:00:00Z')
        const diff = dt1.diff(dt2, ['years', 'weeks', 'days'])
        expect(diff).toEqual({ years: 2, weeks: 14, days: 5 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        // Note: minus doesn't perfectly round-trip with weeks due to Luxon's calendar arithmetic
      })

      it('returns difference in years and months', () => {
        const dt1 = DateTime.fromISO('2028-05-07T09:00:00Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:00:00Z')
        const diff = dt1.diff(dt2, ['years', 'months'])
        expect(diff).toEqual({ years: 2, months: 3 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('returns difference in months and days', () => {
        const dt1 = DateTime.fromISO('2026-05-20T09:00:00Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:00:00Z')
        const diff = dt1.diff(dt2, ['months', 'days'])
        expect(diff).toEqual({ months: 3, days: 13 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('returns difference in years and quarters', () => {
        const dt1 = DateTime.fromISO('2028-11-07T09:00:00Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:00:00Z')
        const diff = dt1.diff(dt2, ['years', 'quarters'])
        expect(diff).toEqual({ years: 2, quarters: 3 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('returns difference in quarters and days', () => {
        const dt1 = DateTime.fromISO('2026-11-20T09:00:00Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:00:00Z')
        const diff = dt1.diff(dt2, ['quarters', 'days'])
        expect(diff).toEqual({ quarters: 3, days: 13 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('handles all time units together', () => {
        const dt1 = DateTime.fromISO('2026-02-07T15:45:30.500Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:15:10.250Z')
        const diff = dt1.diff(dt2, ['hours', 'minutes', 'seconds', 'milliseconds'])
        expect(diff).toEqual({
          hours: 6,
          minutes: 30,
          seconds: 20,
          milliseconds: 250,
        })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })
    })

    describe('with no unit argument', () => {
      it('returns all supported diff units', () => {
        const dt1 = DateTime.fromISO('2026-02-07T09:03:45.500Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:03:44.000Z')
        const diff = dt1.diff(dt2)
        expect(diff).toEqual({
          years: 0,
          months: 0,
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 1,
          milliseconds: 500,
          microseconds: 0,
        })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })
    })

    describe('spanning multiple date and time units', () => {
      it('correctly calculates difference over 1 year, weeks, days, and hours', () => {
        const dt1 = DateTime.fromISO('2027-04-10T13:00:00Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:00:00Z')
        const diff = dt1.diff(dt2, ['years', 'weeks', 'days', 'hours'])
        expect(diff).toEqual({
          years: 1,
          weeks: 8,
          days: 6,
          hours: 4,
        })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('handles differences spanning weeks', () => {
        const dt1 = DateTime.fromISO('2026-03-21T09:00:00Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:00:00Z')
        const diff = dt1.diff(dt2, ['weeks', 'days'])
        expect(diff).toEqual({ weeks: 6, days: 0 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('calculates precise time differences with milliseconds', () => {
        const dt1 = DateTime.fromISO('2026-02-07T10:30:45.750Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:15:30.250Z')
        const diff = dt1.diff(dt2, ['hours', 'minutes', 'seconds', 'milliseconds'])
        expect(diff).toEqual({
          hours: 1,
          minutes: 15,
          seconds: 15,
          milliseconds: 500,
        })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('handles negative differences (earlier minus later)', () => {
        const dt1 = DateTime.fromISO('2026-02-07T09:00:00Z')
        const dt2 = DateTime.fromISO('2026-02-10T15:30:00Z')
        const diff = dt1.diff(dt2, ['days', 'hours', 'minutes'])
        expect(diff).toEqual({ days: -3, hours: -6, minutes: -30 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })
    })

    describe('fractional smallest unit', () => {
      it('returns fractional days when days is the only unit and there is a time component', () => {
        const dt1 = DateTime.fromISO('2026-02-07T21:03:44.077001Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:03:44.077001Z')
        const diff = dt1.diff(dt2, 'days')
        expect(diff).toEqual({ days: 0.5 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('returns fractional hours as the smallest unit in a multi-unit diff', () => {
        const dt1 = DateTime.fromISO('2027-04-10T13:00:00Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:30:00Z')
        const diff = dt1.diff(dt2, ['years', 'weeks', 'days', 'hours'])
        expect(diff).toEqual({
          years: 1,
          weeks: 8,
          days: 6,
          hours: 3.5,
        })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('returns fractional seconds as the smallest unit', () => {
        const dt1 = DateTime.fromISO('2026-02-07T09:03:44.500000Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:03:44.000000Z')
        const diff = dt1.diff(dt2, ['minutes', 'seconds'])
        expect(diff).toEqual({ minutes: 0, seconds: 0.5 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('returns fractional milliseconds when microseconds are not requested', () => {
        const dt1 = DateTime.fromISO('2026-02-07T09:03:44.123456Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:03:44.000000Z')
        const diff = dt1.diff(dt2, 'milliseconds')
        expect(diff).toEqual({ milliseconds: 123.456 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('returns whole milliseconds with fractional microseconds when both are requested', () => {
        const dt1 = DateTime.fromISO('2026-02-07T09:03:44.123456Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:03:44.000000Z')
        const diff = dt1.diff(dt2, ['milliseconds', 'microseconds'])
        expect(diff).toEqual({
          milliseconds: 123,
          microseconds: 456,
        })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('returns whole milliseconds with fractional microseconds when both are requested (inverse)', () => {
        const dt1 = DateTime.fromISO('2026-02-07T09:03:44.123456Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:03:44.000000Z')
        const diff = dt2.diff(dt1, ['milliseconds', 'microseconds'])
        expect(diff).toEqual({
          milliseconds: -123,
          microseconds: -456,
        })
        expect(dt1.plus(diff)).toEqualDateTime(dt2)
        expect(dt2.minus(diff)).toEqualDateTime(dt1)
      })

      it('keeps seconds integral and carries fractional into microseconds', () => {
        const dt1 = DateTime.fromISO('2026-02-07T09:03:44.123456Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:03:43.000000Z')
        const diff = dt1.diff(dt2, ['seconds', 'microseconds'])
        expect(diff).toEqual({
          seconds: 1,
          microseconds: 123456,
        })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('keeps minutes integral and carries fractional into microseconds', () => {
        const dt1 = DateTime.fromISO('2026-02-07T09:04:44.123456Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:03:43.000000Z')
        const diff = dt1.diff(dt2, ['minutes', 'microseconds'])
        expect(diff).toEqual({
          minutes: 1,
          microseconds: 1_123_456,
        })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('keeps hours integral and carries fractional into microseconds', () => {
        const dt1 = DateTime.fromISO('2026-02-07T10:04:44.123456Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:03:43.000000Z')
        const diff = dt1.diff(dt2, ['hours', 'microseconds'])
        expect(diff).toEqual({
          hours: 1,
          microseconds: 61_123_456,
        })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('keeps days integral and carries fractional into microseconds', () => {
        const dt1 = DateTime.fromISO('2026-02-08T10:04:44.123456Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:03:43.000000Z')
        const diff = dt1.diff(dt2, ['days', 'microseconds'])
        expect(diff).toEqual({
          days: 1,
          microseconds: 3_661_123_456,
        })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('keeps weeks integral and carries fractional into microseconds', () => {
        const dt1 = DateTime.fromISO('2026-02-15T10:04:44.123456Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:03:43.000000Z')
        const diff = dt1.diff(dt2, ['weeks', 'microseconds'])
        expect(diff).toEqual({
          weeks: 1,
          microseconds: 90_061_123_456,
        })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('returns fractional minutes as the smallest unit in a multi-unit diff', () => {
        const dt1 = DateTime.fromISO('2026-02-07T10:30:30Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:00:00Z')
        const diff = dt1.diff(dt2, ['hours', 'minutes'])
        expect(diff).toEqual({ hours: 1, minutes: 30.5 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })
    })

    describe('edge cases', () => {
      it('returns zero for same DateTime', () => {
        const dt = DateTime.fromISO('2026-02-07T09:03:44.077001Z')
        const diff = dt.diff(dt, 'seconds')
        expect(diff).toEqual({ seconds: 0 })
        expect(dt.plus(diff)).toEqualDateTime(dt)
        expect(dt.minus(diff)).toEqualDateTime(dt)
      })

      it('includes microsecond difference as fractional milliseconds when milliseconds is the smallest unit', () => {
        const dt1 = DateTime.fromISO('2026-02-07T09:03:44.077001Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:03:44.077999Z')
        const diff = dt1.diff(dt2, 'milliseconds')
        expect(diff).toEqual({ milliseconds: -0.998 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('handles leap year differences', () => {
        // 2024 is a leap year: Feb 28 → Mar 1 spans 2 days (Feb 29 exists)
        const diff1 = DateTime.fromISO('2024-03-01T00:00:00Z').diff(
          DateTime.fromISO('2024-02-28T00:00:00Z'),
          ['days']
        )
        expect(diff1).toEqual({ days: 2 })
        expect(DateTime.fromISO('2024-02-28T00:00:00Z').plus(diff1)).toEqualDateTime(
          DateTime.fromISO('2024-03-01T00:00:00Z')
        )

        // 2025 is not a leap year: Feb 28 → Mar 1 spans only 1 day
        const diff2 = DateTime.fromISO('2025-03-01T00:00:00Z').diff(
          DateTime.fromISO('2025-02-28T00:00:00Z'),
          ['days']
        )
        expect(diff2).toEqual({ days: 1 })
        expect(DateTime.fromISO('2025-02-28T00:00:00Z').plus(diff2)).toEqualDateTime(
          DateTime.fromISO('2025-03-01T00:00:00Z')
        )
      })

      it('handles daylight saving time transitions', () => {
        // 2026-03-08 is spring-forward day in America/New_York (clocks skip 2 AM → 3 AM)
        const endOfDay = DateTime.fromObject(
          { year: 2026, month: 3, day: 9, hour: 0 },
          { zone: 'America/New_York' }
        )
        const startOfDay = DateTime.fromObject(
          { year: 2026, month: 3, day: 8, hour: 0 },
          { zone: 'America/New_York' }
        )
        // The spring-forward day is only 23 hours long
        const diff = endOfDay.diff(startOfDay, 'hours')
        expect(diff).toEqual({ hours: 23 })
        expect(startOfDay.plus(diff)).toEqualDateTime(endOfDay)
        expect(endOfDay.minus(diff)).toEqualDateTime(startOfDay)
      })
    })

    describe('microsecond precision', () => {
      it('returns microsecond difference when requested', () => {
        const dt1 = DateTime.fromISO('2026-02-07T09:03:44.077123Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:03:44.077456Z')
        const diff = dt1.diff(dt2, 'microseconds')
        expect(diff).toEqual({ microseconds: -333 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('correctly calculates single microsecond difference', () => {
        const dt1 = DateTime.fromISO('2026-12-31T23:59:59.999999Z')
        const dt2 = DateTime.fromISO('2027-01-01T00:00:00.000000Z')
        const diff = dt1.diff(dt2, 'microseconds')
        expect(diff).toEqual({ microseconds: -1 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('correctly calculates single microsecond difference (inverse)', () => {
        const dt1 = DateTime.fromISO('2027-01-01T00:00:00.000000Z')
        const dt2 = DateTime.fromISO('2026-12-31T23:59:59.999999Z')
        const diff = dt1.diff(dt2, 'microseconds')
        expect(diff).toEqual({ microseconds: 1 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('returns correct milliseconds and microseconds when spanning 1 microsecond across second boundary', () => {
        const dt1 = DateTime.fromISO('2026-12-31T23:59:59.999999Z')
        const dt2 = DateTime.fromISO('2027-01-01T00:00:00.000000Z')
        const diff = dt1.diff(dt2, [
          'years',
          'weeks',
          'days',
          'hours',
          'minutes',
          'seconds',
          'milliseconds',
          'microseconds',
        ])

        expect(diff).toEqual({
          years: 0,
          weeks: 0,
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
          microseconds: -1,
        })

        // Verify roundtrip works
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('returns correct milliseconds and microseconds when spanning 1 microsecond across second boundary (inverse)', () => {
        const dt1 = DateTime.fromISO('2027-01-01T00:00:00.000000Z')
        const dt2 = DateTime.fromISO('2026-12-31T23:59:59.999999Z')
        const diff = dt1.diff(dt2, [
          'years',
          'weeks',
          'days',
          'hours',
          'minutes',
          'seconds',
          'milliseconds',
          'microseconds',
        ])

        expect(diff).toEqual({
          years: 0,
          weeks: 0,
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
          microseconds: 1,
        })

        // Verify roundtrip works
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('combines milliseconds and microseconds correctly', () => {
        const dt1 = DateTime.fromISO('2026-02-07T09:03:44.123456Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:03:44.000789Z')
        // Total difference: 123456µs - 789µs = 122667µs = 122ms + 667µs
        const diff = dt1.diff(dt2, ['milliseconds', 'microseconds'])
        expect(diff).toEqual({
          milliseconds: 122,
          microseconds: 667,
        })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('handles microseconds with other time units', () => {
        const dt1 = DateTime.fromISO('2026-02-07T10:30:45.123456Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:15:30.000123Z')
        const diff = dt1.diff(dt2, ['hours', 'minutes', 'seconds', 'milliseconds', 'microseconds'])
        expect(diff).toEqual({
          hours: 1,
          minutes: 15,
          seconds: 15,
          milliseconds: 123,
          microseconds: 333,
        })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('calculates large microsecond differences accurately', () => {
        const dt1 = DateTime.fromISO('2026-02-08T09:03:44.077999Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:03:44.077001Z')
        // 1 day = 86,400,000,000 microseconds + 998 microseconds
        const diff = dt1.diff(dt2, 'microseconds')
        expect(diff).toEqual({ microseconds: 86_400_000_998 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('handles zero microsecond difference', () => {
        const dt1 = DateTime.fromISO('2026-02-07T09:03:44.077123Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:03:44.077123Z')
        const diff = dt1.diff(dt2, 'microseconds')
        expect(diff).toEqual({ microseconds: 0 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('handles negative microsecond differences', () => {
        const dt1 = DateTime.fromISO('2026-02-07T09:03:44.077100Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:03:44.077500Z')
        const diff = dt1.diff(dt2, 'microseconds')
        expect(diff).toEqual({ microseconds: -400 })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('includes microseconds in diff when no unit is specified', () => {
        const dt1 = DateTime.fromISO('2026-02-07T09:03:44.077456Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:03:44.077123Z')
        const diff = dt1.diff(dt2)
        expect(diff.microseconds).toEqual(333)
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      it('correctly handles microseconds across millisecond boundaries', () => {
        const dt1 = DateTime.fromISO('2026-02-07T09:03:44.001500Z')
        const dt2 = DateTime.fromISO('2026-02-07T09:03:44.000500Z')
        const diff = dt1.diff(dt2, ['milliseconds', 'microseconds'])
        expect(diff).toEqual({
          milliseconds: 1,
          microseconds: 0,
        })
        expect(dt2.plus(diff)).toEqualDateTime(dt1)
        expect(dt1.minus(diff)).toEqualDateTime(dt2)
      })

      context('with frozen time', () => {
        beforeEach(() => {
          vi.useFakeTimers()
          vi.setSystemTime(new Date('2026-02-07T09:03:44.000Z'))
        })

        afterEach(() => {
          vi.useRealTimers()
        })

        it('maintains precision with diffNow using microseconds', () => {
          const dt = DateTime.now().minus({ microseconds: 500 })
          const diff = dt.diffNow('microseconds')
          expect(diff.microseconds).toEqual(-500)
          expect(DateTime.now().plus(diff)).toEqualDateTime(dt)
          expect(dt.minus(diff)).toEqualDateTime(DateTime.now())
        })
      })
    })

    describe('roundtrip with plus/minus', () => {
      it('roundtrips with no unit specified (all units)', () => {
        const a = DateTime.fromISO('2026-12-31T23:59:59.999999Z')
        const b = DateTime.fromISO('2027-01-01T00:00:00.000000Z')
        const diff = a.diff(b)
        expect(b.plus(diff)).toEqualDateTime(a)
        expect(a.minus(diff)).toEqualDateTime(b)
      })

      it('roundtrips with single unit (microseconds only)', () => {
        const a = DateTime.fromISO('2026-02-07T09:03:44.077123Z')
        const b = DateTime.fromISO('2026-02-07T09:03:44.077456Z')
        const diff = a.diff(b, 'microseconds')
        expect(b.plus(diff)).toEqualDateTime(a)
        expect(a.minus(diff)).toEqualDateTime(b)
      })

      it('roundtrips with single unit (milliseconds only)', () => {
        const a = DateTime.fromISO('2026-02-07T09:03:44.123Z')
        const b = DateTime.fromISO('2026-02-07T09:03:44.456Z')
        const diff = a.diff(b, 'milliseconds')
        // Note: milliseconds from Luxon includes fractional part
        expect(b.plus(diff)).toEqualDateTime(a)
        expect(a.minus(diff)).toEqualDateTime(b)
      })

      it('roundtrips with single unit (seconds)', () => {
        const a = DateTime.fromISO('2026-02-07T09:03:40.000Z')
        const b = DateTime.fromISO('2026-02-07T09:03:50.000Z')
        const diff = a.diff(b, 'seconds')
        expect(b.plus(diff)).toEqualDateTime(a)
        expect(a.minus(diff)).toEqualDateTime(b)
      })

      it('roundtrips with single unit (days)', () => {
        const a = DateTime.fromISO('2026-02-07T09:03:44.000Z')
        const b = DateTime.fromISO('2026-02-15T09:03:44.000Z')
        const diff = a.diff(b, 'days')
        expect(b.plus(diff)).toEqualDateTime(a)
        expect(a.minus(diff)).toEqualDateTime(b)
      })

      it('roundtrips with multiple units (days and hours)', () => {
        const a = DateTime.fromISO('2026-02-07T09:00:00.000Z')
        const b = DateTime.fromISO('2026-02-10T15:00:00.000Z')
        const diff = a.diff(b, ['days', 'hours'])
        expect(b.plus(diff)).toEqualDateTime(a)
        expect(a.minus(diff)).toEqualDateTime(b)
      })

      it('roundtrips with all units including microseconds', () => {
        // Use a shorter time span to avoid cumulative rounding errors from Luxon
        const a = DateTime.fromISO('2026-02-07T09:03:44.123456Z')
        const b = DateTime.fromISO('2026-03-15T17:45:30.789012Z')
        const diff = a.diff(b, [
          'years',
          'weeks',
          'days',
          'hours',
          'minutes',
          'seconds',
          'milliseconds',
          'microseconds',
        ])
        expect(b.plus(diff)).toEqualDateTime(a)
        expect(a.minus(diff)).toEqualDateTime(b)
      })

      it('roundtrips when difference only affects one unit (microseconds)', () => {
        const a = DateTime.fromISO('2026-02-07T09:03:44.000001Z')
        const b = DateTime.fromISO('2026-02-07T09:03:44.000002Z')
        const diff = a.diff(b, ['years', 'days', 'hours', 'minutes', 'seconds', 'microseconds'])
        expect(diff).toEqual({ years: 0, days: 0, hours: 0, minutes: 0, seconds: 0, microseconds: -1 })
        expect(b.plus(diff)).toEqualDateTime(a)
        expect(a.minus(diff)).toEqualDateTime(b)
      })

      it('roundtrips when difference cascades across multiple units', () => {
        const a = DateTime.fromISO('2026-02-28T23:59:59.999999Z')
        const b = DateTime.fromISO('2026-03-01T00:00:00.000000Z')
        const diff = a.diff(b, [
          'years',
          'days',
          'hours',
          'minutes',
          'seconds',
          'milliseconds',
          'microseconds',
        ])
        expect(b.plus(diff)).toEqualDateTime(a)
        expect(a.minus(diff)).toEqualDateTime(b)
      })

      it('roundtrips with hours, minutes, seconds, and microseconds', () => {
        const a = DateTime.fromISO('2026-02-07T10:30:45.123456Z')
        const b = DateTime.fromISO('2026-02-07T15:45:30.789012Z')
        const diff = a.diff(b, ['hours', 'minutes', 'seconds', 'milliseconds', 'microseconds'])
        expect(b.plus(diff)).toEqualDateTime(a)
        expect(a.minus(diff)).toEqualDateTime(b)
      })

      it('roundtrips with year boundary crossing', () => {
        const a = DateTime.fromISO('2025-12-15T10:30:00.123456Z')
        const b = DateTime.fromISO('2027-02-20T15:45:00.789012Z')
        const diff = a.diff(b, ['years', 'days', 'hours', 'minutes', 'microseconds'])
        expect(b.plus(diff)).toEqualDateTime(a)
        expect(a.minus(diff)).toEqualDateTime(b)
      })

      it('roundtrips with negative differences', () => {
        const a = DateTime.fromISO('2027-03-15T18:45:30.555555Z')
        const b = DateTime.fromISO('2026-01-10T06:15:20.111111Z')
        const diff = a.diff(b, [
          'years',
          'days',
          'hours',
          'minutes',
          'seconds',
          'milliseconds',
          'microseconds',
        ])
        expect(b.plus(diff)).toEqualDateTime(a)
        expect(a.minus(diff)).toEqualDateTime(b)
      })

      it('roundtrips with fractional milliseconds from Luxon diff', () => {
        // When Luxon returns fractional milliseconds, they should convert to microseconds
        const a = DateTime.fromISO('2026-02-07T09:03:44.123456Z')
        const b = DateTime.fromISO('2026-02-07T09:03:44.789012Z')
        const diff = a.diff(b, ['milliseconds', 'microseconds'])
        expect(b.plus(diff)).toEqualDateTime(a)
        expect(a.minus(diff)).toEqualDateTime(b)
      })
    })
  })

  describe('#toJSON', () => {
    it('returns ISO format string', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.123456Z')
      expect(datetime.toJSON()).toEqual('2026-02-07T09:03:44.123456Z')
    })

    it('aliases toISO', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.077001Z')
      vi.spyOn(datetime, 'toISO').mockReturnValue('mocked value')
      expect(datetime.toJSON()).toEqual('mocked value')
    })

    it('includes microseconds', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.000001Z')
      expect(datetime.toJSON()).toContain('2026-02-07T09:03:44.000001Z')
    })

    it('is used by JSON.stringify', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.123456Z')
      const json = JSON.stringify({ time: datetime })
      expect(json).toEqual('{"time":"2026-02-07T09:03:44.123456Z"}')
    })

    it('works with arrays', () => {
      const dt1 = DateTime.fromISO('2026-02-07T09:03:44.123456Z')
      const dt2 = DateTime.fromISO('2026-02-08T10:15:30.789012Z')
      const json = JSON.stringify([dt1, dt2])
      expect(json).toEqual('["2026-02-07T09:03:44.123456Z","2026-02-08T10:15:30.789012Z"]')
    })
  })

  describe('#toSQLTime', () => {
    it('omits offset by default', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.123456-05:00')
      expect(datetime.toSQLTime()).toEqual('09:03:44.123456')
    })

    it('includes offset when requested', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.123456-05:00')
      expect(datetime.toSQLTime({ includeOffset: true })).toEqual('09:03:44.123456 -05:00')
    })
  })

  describe('#toString', () => {
    it('returns ISO format string', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.123456Z')
      expect(datetime.toString()).toEqual('2026-02-07T09:03:44.123456Z')
    })

    it('aliases toISO', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.077001Z')
      vi.spyOn(datetime, 'toISO').mockReturnValue('mocked value')
      expect(datetime.toString()).toEqual('mocked value')
    })

    it('includes microseconds', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.000001Z')
      expect(datetime.toString()).toEqual('2026-02-07T09:03:44.000001Z')
    })

    it('works with string concatenation', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.123456Z')
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      const result = `The time is ${datetime}`
      expect(result).toEqual('The time is 2026-02-07T09:03:44.123456Z')
    })
  })

  describe('format presets', () => {
    it('all format constants return valid DateTimeFormatOptions', () => {
      expect(DateTime.DATE_SHORT).toEqual(LuxonDateTime.DATE_SHORT)
      expect(DateTime.DATE_MED).toEqual(LuxonDateTime.DATE_MED)
      expect(DateTime.DATE_MED_WITH_WEEKDAY).toEqual(LuxonDateTime.DATE_MED_WITH_WEEKDAY)
      expect(DateTime.DATE_FULL).toEqual(LuxonDateTime.DATE_FULL)
      expect(DateTime.DATE_HUGE).toEqual(LuxonDateTime.DATE_HUGE)
      expect(DateTime.TIME_SIMPLE).toEqual(LuxonDateTime.TIME_SIMPLE)
      expect(DateTime.TIME_WITH_SECONDS).toEqual(LuxonDateTime.TIME_WITH_SECONDS)
      expect(DateTime.TIME_WITH_SHORT_OFFSET).toEqual(LuxonDateTime.TIME_WITH_SHORT_OFFSET)
      expect(DateTime.TIME_WITH_LONG_OFFSET).toEqual(LuxonDateTime.TIME_WITH_LONG_OFFSET)
      expect(DateTime.TIME_24_SIMPLE).toEqual(LuxonDateTime.TIME_24_SIMPLE)
      expect(DateTime.TIME_24_WITH_SECONDS).toEqual(LuxonDateTime.TIME_24_WITH_SECONDS)
      expect(DateTime.TIME_24_WITH_SHORT_OFFSET).toEqual(LuxonDateTime.TIME_24_WITH_SHORT_OFFSET)
      expect(DateTime.TIME_24_WITH_LONG_OFFSET).toEqual(LuxonDateTime.TIME_24_WITH_LONG_OFFSET)
      expect(DateTime.DATETIME_SHORT).toEqual(LuxonDateTime.DATETIME_SHORT)
      expect(DateTime.DATETIME_SHORT_WITH_SECONDS).toEqual(LuxonDateTime.DATETIME_SHORT_WITH_SECONDS)
      expect(DateTime.DATETIME_MED).toEqual(LuxonDateTime.DATETIME_MED)
      expect(DateTime.DATETIME_MED_WITH_SECONDS).toEqual(LuxonDateTime.DATETIME_MED_WITH_SECONDS)
      expect(DateTime.DATETIME_MED_WITH_WEEKDAY).toEqual(LuxonDateTime.DATETIME_MED_WITH_WEEKDAY)
      expect(DateTime.DATETIME_FULL).toEqual(LuxonDateTime.DATETIME_FULL)
      expect(DateTime.DATETIME_FULL_WITH_SECONDS).toEqual(LuxonDateTime.DATETIME_FULL_WITH_SECONDS)
      expect(DateTime.DATETIME_HUGE).toEqual(LuxonDateTime.DATETIME_HUGE)
      expect(DateTime.DATETIME_HUGE_WITH_SECONDS).toEqual(LuxonDateTime.DATETIME_HUGE_WITH_SECONDS)
    })
  })

  describe('endOf', () => {
    it('returns the end of the year', () => {
      const datetime = DateTime.fromISO('2026-06-15T10:30:45.123456Z').endOf('year')
      expect(datetime.year).toEqual(2026)
      expect(datetime.month).toEqual(12)
      expect(datetime.day).toEqual(31)
      expect(datetime.hour).toEqual(23)
      expect(datetime.minute).toEqual(59)
      expect(datetime.second).toEqual(59)
      expect(datetime.millisecond).toEqual(999)
      expect(datetime.microsecond).toEqual(999)
    })

    it('returns the end of the month', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z').endOf('month')
      expect(datetime.year).toEqual(2026)
      expect(datetime.month).toEqual(2)
      expect(datetime.day).toEqual(28)
      expect(datetime.hour).toEqual(23)
      expect(datetime.minute).toEqual(59)
      expect(datetime.second).toEqual(59)
      expect(datetime.millisecond).toEqual(999)
      expect(datetime.microsecond).toEqual(999)
    })

    it('returns the end of the day', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z').endOf('day')
      expect(datetime.year).toEqual(2026)
      expect(datetime.month).toEqual(2)
      expect(datetime.day).toEqual(15)
      expect(datetime.hour).toEqual(23)
      expect(datetime.minute).toEqual(59)
      expect(datetime.second).toEqual(59)
      expect(datetime.millisecond).toEqual(999)
      expect(datetime.microsecond).toEqual(999)
    })

    it('returns the end of the hour', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z').endOf('hour')
      expect(datetime.year).toEqual(2026)
      expect(datetime.month).toEqual(2)
      expect(datetime.day).toEqual(15)
      expect(datetime.hour).toEqual(10)
      expect(datetime.minute).toEqual(59)
      expect(datetime.second).toEqual(59)
      expect(datetime.millisecond).toEqual(999)
      expect(datetime.microsecond).toEqual(999)
    })

    it('returns the end of the minute', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z').endOf('minute')
      expect(datetime.year).toEqual(2026)
      expect(datetime.month).toEqual(2)
      expect(datetime.day).toEqual(15)
      expect(datetime.hour).toEqual(10)
      expect(datetime.minute).toEqual(30)
      expect(datetime.second).toEqual(59)
      expect(datetime.millisecond).toEqual(999)
      expect(datetime.microsecond).toEqual(999)
    })

    it('returns the end of the second', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z').endOf('second')
      expect(datetime.year).toEqual(2026)
      expect(datetime.month).toEqual(2)
      expect(datetime.day).toEqual(15)
      expect(datetime.hour).toEqual(10)
      expect(datetime.minute).toEqual(30)
      expect(datetime.second).toEqual(45)
      expect(datetime.millisecond).toEqual(999)
      expect(datetime.microsecond).toEqual(999)
    })

    it('returns the end of the millisecond', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z').endOf('millisecond')
      expect(datetime.year).toEqual(2026)
      expect(datetime.month).toEqual(2)
      expect(datetime.day).toEqual(15)
      expect(datetime.hour).toEqual(10)
      expect(datetime.minute).toEqual(30)
      expect(datetime.second).toEqual(45)
      expect(datetime.millisecond).toEqual(123)
      expect(datetime.microsecond).toEqual(999)
    })

    it('preserves timezone', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456-05:00').endOf('day')
      expect(datetime.zoneName).toEqual('UTC-5')
    })
  })

  describe('startOf', () => {
    it('returns the start of the year', () => {
      const datetime = DateTime.fromISO('2026-06-15T10:30:45.123456Z').startOf('year')
      expect(datetime.year).toEqual(2026)
      expect(datetime.month).toEqual(1)
      expect(datetime.day).toEqual(1)
      expect(datetime.hour).toEqual(0)
      expect(datetime.minute).toEqual(0)
      expect(datetime.second).toEqual(0)
      expect(datetime.millisecond).toEqual(0)
      expect(datetime.microsecond).toEqual(0)
    })

    it('returns the start of the month', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z').startOf('month')
      expect(datetime.year).toEqual(2026)
      expect(datetime.month).toEqual(2)
      expect(datetime.day).toEqual(1)
      expect(datetime.hour).toEqual(0)
      expect(datetime.minute).toEqual(0)
      expect(datetime.second).toEqual(0)
      expect(datetime.millisecond).toEqual(0)
      expect(datetime.microsecond).toEqual(0)
    })

    it('returns the start of the day', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z').startOf('day')
      expect(datetime.year).toEqual(2026)
      expect(datetime.month).toEqual(2)
      expect(datetime.day).toEqual(15)
      expect(datetime.hour).toEqual(0)
      expect(datetime.minute).toEqual(0)
      expect(datetime.second).toEqual(0)
      expect(datetime.millisecond).toEqual(0)
      expect(datetime.microsecond).toEqual(0)
    })

    it('returns the start of the hour', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z').startOf('hour')
      expect(datetime.year).toEqual(2026)
      expect(datetime.month).toEqual(2)
      expect(datetime.day).toEqual(15)
      expect(datetime.hour).toEqual(10)
      expect(datetime.minute).toEqual(0)
      expect(datetime.second).toEqual(0)
      expect(datetime.millisecond).toEqual(0)
      expect(datetime.microsecond).toEqual(0)
    })

    it('returns the start of the minute', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z').startOf('minute')
      expect(datetime.year).toEqual(2026)
      expect(datetime.month).toEqual(2)
      expect(datetime.day).toEqual(15)
      expect(datetime.hour).toEqual(10)
      expect(datetime.minute).toEqual(30)
      expect(datetime.second).toEqual(0)
      expect(datetime.millisecond).toEqual(0)
      expect(datetime.microsecond).toEqual(0)
    })

    it('returns the start of the second', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z').startOf('second')
      expect(datetime.year).toEqual(2026)
      expect(datetime.month).toEqual(2)
      expect(datetime.day).toEqual(15)
      expect(datetime.hour).toEqual(10)
      expect(datetime.minute).toEqual(30)
      expect(datetime.second).toEqual(45)
      expect(datetime.millisecond).toEqual(0)
      expect(datetime.microsecond).toEqual(0)
    })

    it('returns the start of the millisecond', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z').startOf('millisecond')
      expect(datetime.year).toEqual(2026)
      expect(datetime.month).toEqual(2)
      expect(datetime.day).toEqual(15)
      expect(datetime.hour).toEqual(10)
      expect(datetime.minute).toEqual(30)
      expect(datetime.second).toEqual(45)
      expect(datetime.millisecond).toEqual(123)
      expect(datetime.microsecond).toEqual(0)
    })

    it('preserves timezone', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456-05:00').startOf('day')
      expect(datetime.zoneName).toEqual('UTC-5')
    })
  })

  describe('toISODate', () => {
    it('returns ISO date string without time', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      expect(datetime.toISODate()).toEqual('2026-02-15')
    })

    it('works with different timezones', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456-05:00')
      expect(datetime.toISODate()).toEqual('2026-02-15')
    })
  })

  describe('toSQL', () => {
    it('returns SQL datetime string with 6 fractional digits', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      expect(datetime.toSQL()).toEqual('2026-02-15 10:30:45.123456 Z')
    })

    it('converts to UTC before formatting', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456-05:00')
      expect(datetime.toSQL()).toEqual('2026-02-15 15:30:45.123456 Z')
    })

    it('pads microseconds to 3 digits', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.000001Z')
      expect(datetime.toSQL()).toEqual('2026-02-15 10:30:45.000001 Z')
    })
  })

  describe('toSQLDate', () => {
    it('returns SQL date string without time', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      expect(datetime.toSQLDate()).toEqual('2026-02-15')
    })

    it('works with different timezones', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456-05:00')
      expect(datetime.toSQLDate()).toEqual('2026-02-15')
    })
  })

  describe('toJSDate', () => {
    it('returns a JavaScript Date object', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      const jsDate = datetime.toJSDate()
      expect(jsDate).toBeInstanceOf(Date)
      expect(jsDate.toISOString()).toEqual('2026-02-15T10:30:45.123Z')
    })
  })

  describe('toLocaleString', () => {
    it('formats using default locale', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      const result = datetime.toLocaleString()
      expect(result).toBeDefined()
      expect(typeof result).toEqual('string')
    })

    it('formats using DATE_SHORT preset', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      const result = datetime.toLocaleString(DateTime.DATE_SHORT)
      expect(result).toMatch(/2.*15.*26/) // Flexible match for different locales
    })

    it('formats using DATETIME_FULL preset', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      const result = datetime.toLocaleString(DateTime.DATETIME_FULL)
      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    })

    it('accepts locale option', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      const result = datetime.toLocaleString({ weekday: 'long' }, { locale: 'en-US' })
      expect(result).toContain('Sunday')
    })
  })

  describe('toFormat', () => {
    it('formats with custom format string', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      expect(datetime.toFormat('yyyy-MM-dd')).toEqual('2026-02-15')
    })

    it('formats with time components', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      expect(datetime.toFormat('yyyy-MM-dd HH:mm:ss')).toEqual('2026-02-15 10:30:45')
    })

    it('includes milliseconds with SSS token', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      expect(datetime.toFormat('yyyy-MM-dd HH:mm:ss.SSS')).toEqual('2026-02-15 10:30:45.123')
    })

    it('includes microseconds with SSSSSS token', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      expect(datetime.toFormat('yyyy-MM-dd HH:mm:ss.SSSSSS')).toEqual('2026-02-15 10:30:45.123456')
    })

    it('pads fractional seconds correctly', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.001002Z')
      expect(datetime.toFormat('HH:mm:ss.SSSSSS')).toEqual('10:30:45.001002')
    })

    it('truncates to requested precision', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      expect(datetime.toFormat('HH:mm:ss.S')).toEqual('10:30:45.1')
      expect(datetime.toFormat('HH:mm:ss.SS')).toEqual('10:30:45.12')
      expect(datetime.toFormat('HH:mm:ss.SSSS')).toEqual('10:30:45.1234')
    })

    it('accepts locale option', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      const result = datetime.toFormat('MMMM', { locale: 'fr' })
      expect(result).toEqual('février')
    })
  })

  describe('setZone', () => {
    it('changes timezone to UTC', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456-05:00').setZone('UTC')
      expect(datetime.zoneName).toEqual('UTC')
      expect(datetime.hour).toEqual(15) // Adjusted for timezone
      expect(datetime.microsecond).toEqual(456) // Preserved
    })

    it('changes timezone to America/New_York', () => {
      const datetime = DateTime.fromISO('2026-02-15T15:30:45.123456Z').setZone('America/New_York')
      expect(datetime.zoneName).toEqual('America/New_York')
      expect(datetime.hour).toEqual(10) // EST is UTC-5
      expect(datetime.microsecond).toEqual(456)
    })

    it('keeps local time when option is set', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      const converted = datetime.setZone('America/New_York', { keepLocalTime: true })
      expect(converted.hour).toEqual(10) // Same hour, different timezone
      expect(converted.zoneName).toEqual('America/New_York')
    })
  })

  describe('toUTC', () => {
    it('converts to UTC', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456-05:00').toUTC()
      expect(datetime.zoneName).toEqual('UTC')
      expect(datetime.hour).toEqual(15)
      expect(datetime.microsecond).toEqual(456)
    })

    it('is a no-op when already in UTC', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      const utc = datetime.toUTC()
      expect(utc.zoneName).toEqual('UTC')
      expect(utc.hour).toEqual(10)
    })
  })

  describe('toLocal', () => {
    it('converts to local timezone', () => {
      const datetime = DateTime.fromISO('2026-02-15T05:30:45.123456-05:00')
      const local = datetime.toLocal()
      // Since we set the timezone of Node to UTC, toLocal simply changes to UTC
      expect(local.toISO()).toEqual('2026-02-15T10:30:45.123456Z')
    })
  })

  describe('reconfigure', () => {
    it('changes locale', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      const reconfigured = datetime.reconfigure({ locale: 'fr' })
      expect(reconfigured.locale).toEqual('fr')
      expect(reconfigured.microsecond).toEqual(456)
    })
  })

  describe('setLocale', () => {
    it('changes locale', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      const newLocale = datetime.setLocale('fr')
      expect(newLocale.locale).toEqual('fr')
      expect(newLocale.microsecond).toEqual(456)
    })

    it('affects formatted output', () => {
      const datetime = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      const withFrench = datetime.setLocale('fr')
      expect(withFrench.toFormat('MMMM')).toEqual('février')
    })
  })

  describe('hasSame', () => {
    it('returns true when same year', () => {
      const dt1 = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      const dt2 = DateTime.fromISO('2026-08-20T14:15:30.789012Z')
      expect(dt1.hasSame(dt2, 'year')).toEqual(true)
    })

    it('returns false when different year', () => {
      const dt1 = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      const dt2 = DateTime.fromISO('2027-02-15T10:30:45.123456Z')
      expect(dt1.hasSame(dt2, 'year')).toEqual(false)
    })

    it('returns true when same month', () => {
      const dt1 = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      const dt2 = DateTime.fromISO('2026-02-20T14:15:30.789012Z')
      expect(dt1.hasSame(dt2, 'month')).toEqual(true)
    })

    it('returns false when different month', () => {
      const dt1 = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      const dt2 = DateTime.fromISO('2026-03-15T10:30:45.123456Z')
      expect(dt1.hasSame(dt2, 'month')).toEqual(false)
    })

    it('returns true when same day', () => {
      const dt1 = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      const dt2 = DateTime.fromISO('2026-02-15T14:15:30.789012Z')
      expect(dt1.hasSame(dt2, 'day')).toEqual(true)
    })

    it('returns false when different day', () => {
      const dt1 = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      const dt2 = DateTime.fromISO('2026-02-16T10:30:45.123456Z')
      expect(dt1.hasSame(dt2, 'day')).toEqual(false)
    })

    it('returns true when same hour', () => {
      const dt1 = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      const dt2 = DateTime.fromISO('2026-02-15T10:45:30.789012Z')
      expect(dt1.hasSame(dt2, 'hour')).toEqual(true)
    })

    it('returns false when different hour', () => {
      const dt1 = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      const dt2 = DateTime.fromISO('2026-02-15T11:30:45.123456Z')
      expect(dt1.hasSame(dt2, 'hour')).toEqual(false)
    })

    it('returns true when same minute', () => {
      const dt1 = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      const dt2 = DateTime.fromISO('2026-02-15T10:30:50.789012Z')
      expect(dt1.hasSame(dt2, 'minute')).toEqual(true)
    })

    it('returns true when same second', () => {
      const dt1 = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      const dt2 = DateTime.fromISO('2026-02-15T10:30:45.789012Z')
      expect(dt1.hasSame(dt2, 'second')).toEqual(true)
    })

    it('returns true when same millisecond', () => {
      const dt1 = DateTime.fromISO('2026-02-15T10:30:45.123456Z')
      const dt2 = DateTime.fromISO('2026-02-15T10:30:45.123999Z')
      expect(dt1.hasSame(dt2, 'millisecond')).toEqual(true)
    })
  })

  describe('diffNow', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-07T09:03:44.000Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns difference from now in specified unit', () => {
      const future = DateTime.fromISO('2026-02-08T09:03:44.000Z')
      const diff = future.diffNow('days')
      expect(diff).toEqual({ days: 1 })
    })

    it('returns negative difference for past dates', () => {
      const past = DateTime.fromISO('2026-02-06T09:03:44.000Z')
      const diff = past.diffNow('days')
      expect(diff).toEqual({ days: -1 })
    })

    it('supports multiple units', () => {
      const future = DateTime.fromISO('2026-02-08T15:30:00.000Z')
      const diff = future.diffNow(['days', 'hours', 'minutes'])
      expect(diff.days).toEqual(1)
      expect(diff.hours).toEqual(6)
      expect(diff.minutes).toBeCloseTo(26.27, 1)
    })

    it('supports microseconds', () => {
      const dt = DateTime.fromISO('2026-02-07T09:03:44.000500Z')
      const diff = dt.diffNow('microseconds')
      expect(diff).toEqual({ microseconds: 500 })
    })
  })
})
