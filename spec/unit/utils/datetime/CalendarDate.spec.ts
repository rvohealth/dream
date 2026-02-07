import CalendarDate, { InvalidCalendarDate } from '../../../../src/utils/datetime/CalendarDate.js'
import { DateTime } from '../../../../src/utils/datetime/DateTime.js'

describe('CalendarDate', () => {
  describe('constructor', () => {
    context('without an argument', () => {
      it('sets itself to today', () => {
        const calendarDate = CalendarDate.today()
        expect(calendarDate).toEqualCalendarDate(CalendarDate.today())
      })
    })

    context('with null', () => {
      it('sets itself to today', () => {
        const calendarDate = CalendarDate.today()
        expect(calendarDate).toEqualCalendarDate(CalendarDate.today())
      })
    })

    context('with a DateTime', () => {
      it('creates a CalendarDate', () => {
        const calendarDate = CalendarDate.fromDateTime(DateTime.fromISO('2024-02-29'))
        expect(calendarDate.toISO()).toEqual('2024-02-29')
      })
    })

    context('with a valid series of year, month, day numbers', () => {
      it('creates a CalendarDate', () => {
        const calendarDate = CalendarDate.fromObject({ year: 2024, month: 2, day: 29 })
        expect(calendarDate.toISO()).toEqual('2024-02-29')
      })
    })

    context('with an invalid series of year, month, day numbers', () => {
      it('throws InvalidCalendarDate', () => {
        expect(() => CalendarDate.fromObject({ year: 2023, month: 2, day: 29 })).toThrow(InvalidCalendarDate)
      })
    })
  })

  describe('.today', () => {
    it('creates a DateTime for today', () => {
      const today = CalendarDate.today()
      const now = DateTime.now()
      expect(today.toISO()).toEqual(now.toISODate())
    })

    context('with a timezone argument', () => {
      it('creates a DateTime for today in the specified timezone', () => {
        const today1 = CalendarDate.today({ zone: 'Pacific/Kiritimati' })
        const now1 = DateTime.now().setZone('Pacific/Kiritimati')
        const today2 = CalendarDate.today({ zone: 'Pacific/Midway' })
        const now2 = DateTime.now().setZone('Pacific/Midway')

        expect(today1.toISO()).toEqual(now1.toISODate())
        expect(today2.toISO()).toEqual(now2.toISODate())
      })
    })
  })

  describe('.tomorrow', () => {
    it('is today plus 1 day', () => {
      vi.spyOn(CalendarDate, 'today').mockReturnValue(CalendarDate.fromISO('2023-12-31'))
      const tomorrow = CalendarDate.tomorrow()
      expect(tomorrow.toISO()).toEqual('2024-01-01')
    })
  })

  describe('.yesterday', () => {
    it('is today minus 1 day ', () => {
      vi.spyOn(CalendarDate, 'today').mockReturnValue(CalendarDate.fromISO('2024-01-01'))
      const yesterday = CalendarDate.yesterday()
      expect(yesterday.toISO()).toEqual('2023-12-31')
    })
  })

  describe('.fromISO', () => {
    it('creates a CalendarDate', () => {
      const calendarDate = CalendarDate.fromISO('2024-03-02')
      expect(calendarDate.toISO()).toEqual('2024-03-02')
    })

    context('with a full ISO datetime string', () => {
      it('does not have its timezone overridden by a default timezone', () => {
        const calendarDate = CalendarDate.fromISO('2024-05-05T22:43:36.032-05:00')
        expect(calendarDate.toISO()).toEqual('2024-05-05')
      })

      context('with timezone that changes the date forward (evening time -> next day UTC)', () => {
        it('results in the next day when zone is UTC', () => {
          // 8pm in -5:00 timezone = next day 1am UTC
          const calendarDate = CalendarDate.fromISO('2026-02-10T20:00:00-05:00', { zone: 'UTC' })
          expect(calendarDate.toISO()).toEqual('2026-02-11')
        })

        it('results in the same day when zone matches the time component', () => {
          // 8pm in -5:00 stays 2026-02-10 when interpreted as America/Chicago
          const calendarDate = CalendarDate.fromISO('2026-02-10T20:00:00-05:00', { zone: 'America/Chicago' })
          expect(calendarDate.toISO()).toEqual('2026-02-10')
        })
      })

      context('with timezone that changes the date backward (early morning UTC -> previous day)', () => {
        it('results in the same day when zone is UTC', () => {
          // 2am UTC stays 2026-02-11 in UTC
          const calendarDate = CalendarDate.fromISO('2026-02-11T02:00:00Z', { zone: 'UTC' })
          expect(calendarDate.toISO()).toEqual('2026-02-11')
        })

        it('results in the previous day when zone is behind UTC', () => {
          // 2am UTC = 8pm previous day in America/Chicago (CST is UTC-6)
          const calendarDate = CalendarDate.fromISO('2026-02-11T02:00:00Z', { zone: 'America/Chicago' })
          expect(calendarDate.toISO()).toEqual('2026-02-10')
        })
      })
    })

    context('with a date-only ISO string (no time component)', () => {
      it('results in the same date regardless of zone', () => {
        const dateString = '2026-02-10'
        const withoutZone = CalendarDate.fromISO(dateString)
        const withUTC = CalendarDate.fromISO(dateString, { zone: 'UTC' })
        const withChicago = CalendarDate.fromISO(dateString, { zone: 'America/Chicago' })
        const withTokyo = CalendarDate.fromISO(dateString, { zone: 'Asia/Tokyo' })

        expect(withoutZone.toISO()).toEqual('2026-02-10')
        expect(withUTC.toISO()).toEqual('2026-02-10')
        expect(withChicago.toISO()).toEqual('2026-02-10')
        expect(withTokyo.toISO()).toEqual('2026-02-10')
      })
    })

    context('with an invalid date string', () => {
      it('throws InvalidCalendarDate', () => {
        expect(() => CalendarDate.fromISO('2023-02-29')).toThrow(InvalidCalendarDate)
      })
    })
  })

  describe('.fromSQL', () => {
    it('creates a CalendarDate', () => {
      const calendarDate = CalendarDate.fromSQL('2024-03-02')
      expect(calendarDate.toISO()).toEqual('2024-03-02')
    })

    context('with an invalid date string', () => {
      it('throws InvalidCalendarDate', () => {
        expect(() => CalendarDate.fromSQL('2023-02-29')).toThrow(InvalidCalendarDate)
      })
    })
  })

  describe('.fromFormat', () => {
    it('parses a date string with a format string', () => {
      const calendarDate = CalendarDate.fromFormat('12/15/2017', 'MM/dd/yyyy')
      expect(calendarDate.year).toEqual(2017)
      expect(calendarDate.month).toEqual(12)
      expect(calendarDate.day).toEqual(15)
    })

    it('parses a date with month name', () => {
      const calendarDate = CalendarDate.fromFormat('May 25, 1982', 'MMMM dd, yyyy')
      expect(calendarDate.year).toEqual(1982)
      expect(calendarDate.month).toEqual(5)
      expect(calendarDate.day).toEqual(25)
    })

    it('parses a date with time components (time is ignored for date)', () => {
      const calendarDate = CalendarDate.fromFormat('12/15/2017 10:30:45', 'MM/dd/yyyy HH:mm:ss')
      expect(calendarDate.year).toEqual(2017)
      expect(calendarDate.month).toEqual(12)
      expect(calendarDate.day).toEqual(15)
      // Time components are not exposed in CalendarDate
    })

    context('with zone option and timezone in format', () => {
      it('can change the date from the one specified in the format to the one specified in the optoin', () => {
        const date1 = CalendarDate.fromFormat('12/15/2017 02:00:00 +00:00', 'MM/dd/yyyy HH:mm:ss ZZ', {
          zone: 'America/New_York',
        })
        expect(date1.toISO()).toEqual('2017-12-14')

        const date2 = CalendarDate.fromFormat('12/14/2017 21:00:00 -05:00', 'MM/dd/yyyy HH:mm:ss ZZ', {
          zone: 'UTC',
        })
        expect(date2.toISO()).toEqual('2017-12-15')
      })
    })

    it('accepts locale option', () => {
      const calendarDate = CalendarDate.fromFormat('mai 25, 1982', 'MMMM dd, yyyy', { locale: 'fr' })
      expect(calendarDate.year).toEqual(1982)
      expect(calendarDate.month).toEqual(5)
      expect(calendarDate.day).toEqual(25)
    })

    it('throws InvalidCalendarDate when format does not match', () => {
      expect(() => CalendarDate.fromFormat('not-matching', 'MM/dd/yyyy')).toThrow(InvalidCalendarDate)
    })

    it('throws InvalidCalendarDate when string is invalid for format', () => {
      expect(() => CalendarDate.fromFormat('13/45/2017', 'MM/dd/yyyy')).toThrow(InvalidCalendarDate)
    })

    it('parses date-only formats', () => {
      const calendarDate = CalendarDate.fromFormat('2017-12-15', 'yyyy-MM-dd')
      expect(calendarDate.toISO()).toEqual('2017-12-15')
    })
  })

  describe('.fromObject', () => {
    it('creates a CalendarDate', () => {
      const calendarDate = CalendarDate.fromObject({ year: 2023, month: 6, day: 16 })
      expect(calendarDate.toISO()).toEqual('2023-06-16')
    })

    context('with an invalid date', () => {
      it('throws InvalidCalendarDate', () => {
        expect(() => CalendarDate.fromObject({ year: 2023, month: 2, day: 29 })).toThrow(InvalidCalendarDate)
      })
    })
  })

  describe('#toISO', () => {
    it('returns a YYYY-MM-DD string', () => {
      const calendarDate = CalendarDate.fromISO('2024-03-02')
      expect(calendarDate.toISO()).toEqual('2024-03-02')
    })
  })

  describe('#toSQL', () => {
    it('returns a YYYY-MM-DD string', () => {
      const calendarDate = CalendarDate.fromISO('2024-03-02')
      expect(calendarDate.toSQL()).toEqual('2024-03-02')
    })
  })

  describe('#toISODate', () => {
    it('aliases toISO', () => {
      const calendarDate = CalendarDate.today()
      vi.spyOn(calendarDate, 'toISO').mockReturnValue('hello world')
      expect(calendarDate.toISODate()).toEqual('hello world')
    })
  })

  describe('#toJSON', () => {
    it('aliases toISO', () => {
      const calendarDate = CalendarDate.today()
      vi.spyOn(calendarDate, 'toISO').mockReturnValue('hello world')
      expect(calendarDate.toJSON()).toEqual('hello world')
    })
  })

  describe('#valueOf', () => {
    it('returns ISO date string', () => {
      const calendarDate = CalendarDate.fromISO('2025-10-12')
      expect(calendarDate.valueOf()).toEqual('2025-10-12')
    })
  })

  describe('#toLocaleString', () => {
    it('delegates to DateTime', () => {
      const calendarDate = CalendarDate.fromISO('2024-03-02')
      expect(
        calendarDate.toLocaleString({
          month: 'short',
          day: 'numeric',
        })
      ).toEqual('Mar 2')
    })
  })

  describe('#toString', () => {
    it('aliases toISO', () => {
      const calendarDate = CalendarDate.today()
      vi.spyOn(calendarDate, 'toISO').mockReturnValue('hello world')
      expect(calendarDate.toString()).toEqual('hello world')
    })
  })

  describe('#year', () => {
    it('is the year of the date', () => {
      const calendarDate = CalendarDate.fromISO('2024-03-02')
      expect(calendarDate.year).toEqual(2024)
    })
  })

  describe('#month', () => {
    it('is the month of the date', () => {
      const calendarDate = CalendarDate.fromISO('2024-03-02')
      expect(calendarDate.month).toEqual(3)
    })
  })

  describe('#day', () => {
    it('is the day of the date', () => {
      const calendarDate = CalendarDate.fromISO('2024-03-02')
      expect(calendarDate.day).toEqual(2)
    })
  })

  describe('#plus', () => {
    it('subtracts the number of days from the date, accounting for leap year', () => {
      const calendarDate = CalendarDate.fromISO('2024-02-27')
      expect(calendarDate.plus({ days: 4 })).toEqualCalendarDate(CalendarDate.fromISO('2024-03-02'))
    })
  })

  describe('#minus', () => {
    it('subtracts the number of days from the date, accounting for leap year', () => {
      const calendarDate = CalendarDate.fromISO('2024-03-02')
      expect(calendarDate.minus({ days: 4 })).toEqualCalendarDate(CalendarDate.fromISO('2024-02-27'))
    })
  })

  describe('.max', () => {
    it('is the larger of the two CalendarDates', () => {
      const calendarDate = CalendarDate.fromISO('2024-02-27')
      const otherCalendarDate = CalendarDate.fromISO('2024-03-02')
      const max = CalendarDate.max(calendarDate, otherCalendarDate)
      expect(max).toEqualCalendarDate(otherCalendarDate)
    })
  })

  describe('.min', () => {
    it('is the larger of the two CalendarDates', () => {
      const calendarDate = CalendarDate.fromISO('2024-02-27')
      const otherCalendarDate = CalendarDate.fromISO('2024-03-02')
      const min = CalendarDate.min(calendarDate, otherCalendarDate)
      expect(min).toEqualCalendarDate(calendarDate)
    })
  })

  describe('#diff', () => {
    describe('with single unit argument', () => {
      it('returns difference in years', () => {
        const d1 = CalendarDate.fromISO('2026-02-07')
        const d2 = CalendarDate.fromISO('2023-02-07')
        const diff = d1.diff(d2, 'years')
        expect(diff).toEqual({ years: 3 })
      })

      it('returns difference in months', () => {
        const d1 = CalendarDate.fromISO('2026-05-07')
        const d2 = CalendarDate.fromISO('2026-02-07')
        const diff = d1.diff(d2, 'months')
        expect(diff).toEqual({ months: 3 })
      })

      it('returns difference in quarters', () => {
        const d1 = CalendarDate.fromISO('2026-11-07')
        const d2 = CalendarDate.fromISO('2026-02-07')
        const diff = d1.diff(d2, 'quarters')
        expect(diff).toEqual({ quarters: 3 })
      })

      it('returns difference in weeks', () => {
        const d1 = CalendarDate.fromISO('2026-02-21')
        const d2 = CalendarDate.fromISO('2026-02-07')
        const diff = d1.diff(d2, 'weeks')
        expect(diff).toEqual({ weeks: 2 })
      })

      it('returns difference in days', () => {
        const d1 = CalendarDate.fromISO('2026-02-15')
        const d2 = CalendarDate.fromISO('2026-02-07')
        const diff = d1.diff(d2, 'days')
        expect(diff).toEqual({ days: 8 })
      })

      it('handles negative differences', () => {
        const d1 = CalendarDate.fromISO('2024-02-27')
        const d2 = CalendarDate.fromISO('2024-03-02')
        const diff = d1.diff(d2, 'days')
        expect(diff).toEqual({ days: -4 })
      })

      context('across daylight savings time', () => {
        it('returns correct day difference', () => {
          const d1 = CalendarDate.fromISO('2024-03-11')
          const d2 = CalendarDate.fromISO('2024-03-10')
          expect(d1.diff(d2, 'days')).toEqual({ days: 1 })
        })
      })
    })

    describe('with multiple units argument (array)', () => {
      it('returns difference in years and weeks', () => {
        const d1 = CalendarDate.fromISO('2028-02-21')
        const d2 = CalendarDate.fromISO('2026-02-07')
        const diff = d1.diff(d2, ['years', 'weeks'])
        expect(diff).toEqual({ years: 2, weeks: 2 })
      })

      it('returns difference in weeks and days', () => {
        const d1 = CalendarDate.fromISO('2026-02-25')
        const d2 = CalendarDate.fromISO('2026-02-07')
        const diff = d1.diff(d2, ['weeks', 'days'])
        expect(diff).toEqual({ weeks: 2, days: 4 })
      })

      it('returns difference in years, weeks, and days', () => {
        const d1 = CalendarDate.fromISO('2028-05-20')
        const d2 = CalendarDate.fromISO('2026-02-07')
        const diff = d1.diff(d2, ['years', 'weeks', 'days'])
        expect(diff).toEqual({ years: 2, weeks: 14, days: 5 })
      })

      it('returns difference in years and months', () => {
        const d1 = CalendarDate.fromISO('2028-05-07')
        const d2 = CalendarDate.fromISO('2026-02-07')
        const diff = d1.diff(d2, ['years', 'months'])
        expect(diff).toEqual({ years: 2, months: 3 })
      })

      it('returns difference in months and days', () => {
        const d1 = CalendarDate.fromISO('2026-05-20')
        const d2 = CalendarDate.fromISO('2026-02-07')
        const diff = d1.diff(d2, ['months', 'days'])
        expect(diff).toEqual({ months: 3, days: 13 })
      })

      it('handles months correctly across different month lengths', () => {
        // January to February (31-day month to 28-day month)
        const jan7 = CalendarDate.fromISO('2026-01-07')
        const feb10 = CalendarDate.fromISO('2026-02-10')
        const diff1 = feb10.diff(jan7, ['months', 'days'])
        expect(diff1).toEqual({ months: 1, days: 3 })

        // February to March (28-day month to 31-day month)
        const feb7 = CalendarDate.fromISO('2026-02-07')
        const mar10 = CalendarDate.fromISO('2026-03-10')
        const diff2 = mar10.diff(feb7, ['months', 'days'])
        expect(diff2).toEqual({ months: 1, days: 3 })
      })

      it('returns difference in years and quarters', () => {
        const d1 = CalendarDate.fromISO('2028-11-07')
        const d2 = CalendarDate.fromISO('2026-02-07')
        const diff = d1.diff(d2, ['years', 'quarters'])
        expect(diff).toEqual({ years: 2, quarters: 3 })
      })

      it('returns difference in quarters and days', () => {
        const d1 = CalendarDate.fromISO('2026-11-20')
        const d2 = CalendarDate.fromISO('2026-02-07')
        const diff = d1.diff(d2, ['quarters', 'days'])
        expect(diff).toEqual({ quarters: 3, days: 13 })
      })
    })

    describe('with no unit argument', () => {
      it('returns all supported date diff units', () => {
        const d1 = CalendarDate.fromISO('2026-02-15')
        const d2 = CalendarDate.fromISO('2026-02-07')
        const diff = d1.diff(d2)
        expect(diff).toEqual({
          years: 0,
          months: 0,
          days: 8,
        })
      })
    })
  })

  describe('#diffNow', () => {
    describe('with single unit argument', () => {
      it('returns positive difference when date is in future', () => {
        const future = CalendarDate.today().plus({ days: 7 })
        const diff = future.diffNow('days')
        expect(diff).toEqual({ days: 7 })
      })

      it('returns negative difference when date is in past', () => {
        const past = CalendarDate.today().minus({ days: 7 })
        const diff = past.diffNow('days')
        expect(diff).toEqual({ days: -7 })
      })
    })

    describe('with multiple units argument', () => {
      it('returns difference in specified units', () => {
        const future = CalendarDate.today().plus({ weeks: 2, days: 3 })
        const diff = future.diffNow(['weeks', 'days'])
        expect(diff).toEqual({ weeks: 2, days: 3 })
      })
    })

    describe('with no unit argument', () => {
      it('returns all date units', () => {
        const future = CalendarDate.today().plus({ days: 10 })
        const diff = future.diffNow()
        expect(diff).toHaveProperty('years')
        expect(diff).toHaveProperty('months')
        expect(diff).toHaveProperty('days')
      })
    })
  })

  describe('<', () => {
    context('when the date is greater than the other date', () => {
      it('is false', () => {
        const calendarDate = CalendarDate.fromISO('2024-03-02')
        const otherCalendarDate = CalendarDate.fromISO('2024-02-27')
        expect(calendarDate < otherCalendarDate).toBe(false)
      })
    })

    context('when the date is less than the other date', () => {
      it('is true', () => {
        const calendarDate = CalendarDate.fromISO('2024-02-27')
        const otherCalendarDate = CalendarDate.fromISO('2024-03-02')
        expect(calendarDate < otherCalendarDate).toBe(true)
      })
    })

    context('when the date is equal to the other date', () => {
      it('is false', () => {
        const calendarDate = CalendarDate.fromISO('2024-02-27')
        const otherCalendarDate = CalendarDate.fromISO('2024-02-27')
        expect(calendarDate < otherCalendarDate).toBe(false)
      })
    })
  })

  describe('>', () => {
    context('when the date is greater than the other date', () => {
      it('is true', () => {
        const calendarDate = CalendarDate.fromISO('2024-03-02')
        const otherCalendarDate = CalendarDate.fromISO('2024-02-27')
        expect(calendarDate > otherCalendarDate).toBe(true)
      })
    })

    context('when the date is less than the other date', () => {
      it('is false', () => {
        const calendarDate = CalendarDate.fromISO('2024-02-27')
        const otherCalendarDate = CalendarDate.fromISO('2024-03-02')
        expect(calendarDate > otherCalendarDate).toBe(false)
      })
    })

    context('when the date is equal to the other date', () => {
      it('is false', () => {
        const calendarDate = CalendarDate.fromISO('2024-02-27')
        const otherCalendarDate = CalendarDate.fromISO('2024-02-27')
        expect(calendarDate > otherCalendarDate).toBe(false)
      })
    })
  })

  describe('#diffNow', () => {
    describe('with single unit argument', () => {
      it('returns positive difference when date is in future', () => {
        const future = CalendarDate.today().plus({ days: 7 })
        const diff = future.diffNow('days')
        expect(diff).toEqual({ days: 7 })
      })

      it('returns negative difference when date is in past', () => {
        const past = CalendarDate.today().minus({ days: 7 })
        const diff = past.diffNow('days')
        expect(diff).toEqual({ days: -7 })
      })
    })

    describe('with multiple units argument', () => {
      it('returns difference in specified units', () => {
        const future = CalendarDate.today().plus({ weeks: 2, days: 3 })
        const diff = future.diffNow(['weeks', 'days'])
        expect(diff).toEqual({ weeks: 2, days: 3 })
      })
    })

    describe('with no unit argument', () => {
      it('returns all date units', () => {
        const future = CalendarDate.today().plus({ days: 10 })
        const diff = future.diffNow()
        expect(diff).toHaveProperty('years')
        expect(diff).toHaveProperty('months')
        expect(diff).toHaveProperty('days')
      })
    })
  })

  describe('.fromDateTime', () => {
    it('creates a CalendarDate equivalent to the date part of the DateTime', () => {
      const dateTime = DateTime.fromISO('2024-05-05T17:53:07.397Z')
      const calendarDate = CalendarDate.fromDateTime(dateTime)
      expect(calendarDate.toISO()).toEqual('2024-05-05')
    })
  })

  describe('.fromJSDate', () => {
    it('creates a CalendarDate equivalent to the date part of the DateTime', () => {
      const javascriptDate = new Date('2024-05-05T01:53:07.397Z')
      const calendarDate = CalendarDate.fromJSDate(javascriptDate)
      expect(calendarDate.toISO()).toEqual('2024-05-05')
    })

    describe('with a timezone', () => {
      it('creates a CalendarDate equivalent to the date part of the DateTime in the specified timezone', () => {
        const javascriptDate = new Date('2024-05-05T01:53:07.397Z')
        const calendarDate = CalendarDate.fromJSDate(javascriptDate, { zone: 'America/Chicago' })
        expect(calendarDate.toISO()).toEqual('2024-05-04')
      })
    })
  })

  describe('.fromJSDate', () => {
    it('creates a CalendarDate', () => {
      const calendarDate = CalendarDate.fromJSDate(new Date('2024-03-02'))
      expect(calendarDate.toISO()).toEqual('2024-03-02')
    })

    context('with a full ISO datetime string', () => {
      it('it is the date in the node environment’s timezone, which is set via the TZ environment variable (e.g. TZ=UTC)', () => {
        const calendarDate = CalendarDate.fromJSDate(new Date('2024-05-05T22:43:36.032-05:00'))
        expect(calendarDate.toISO()).toEqual('2024-05-06')
      })

      context('when passed an explicit timezone override that changes the date to a different date', () => {
        it('it is the date in the specified timezone', () => {
          const calendarDate = CalendarDate.fromJSDate(new Date('2024-05-05T22:43:36.032-05:00'), {
            zone: 'UTC',
          })
          expect(calendarDate.toISO()).toEqual('2024-05-06')
        })
      })

      context(
        'when passed an explicit timezone override that does not change the date to a different date',
        () => {
          it('it is the date in the specified timezone', () => {
            const calendarDate = CalendarDate.fromJSDate(new Date('2024-05-05T22:43:36.032-05:00'), {
              zone: 'America/Chicago',
            })
            expect(calendarDate.toISO()).toEqual('2024-05-05')
          })
        }
      )
    })
  })

  describe('#startOf', () => {
    it('returns a CalendarDate at the beginning of the specified time period', () => {
      const calendarDate = CalendarDate.fromISO('2024-07-18')
      expect(calendarDate.startOf('month')).toEqualCalendarDate(CalendarDate.fromISO('2024-07-01'))
    })
  })

  describe('#endOf', () => {
    it('returns a CalendarDate at the beginning of the specified time period', () => {
      const calendarDate = CalendarDate.fromISO('2024-07-18')
      expect(calendarDate.endOf('month')).toEqualCalendarDate(CalendarDate.fromISO('2024-07-31'))
    })
  })

  describe('#set', () => {
    it('sets a single date unit', () => {
      const date = CalendarDate.fromISO('2026-02-07')
      const updated = date.set({ year: 2025 })
      expect(updated.year).toEqual(2025)
      expect(updated.month).toEqual(2)
      expect(updated.day).toEqual(7)
    })

    it('sets multiple date units', () => {
      const date = CalendarDate.fromISO('2026-02-07')
      const updated = date.set({ year: 2025, month: 12, day: 15 })
      expect(updated.year).toEqual(2025)
      expect(updated.month).toEqual(12)
      expect(updated.day).toEqual(15)
    })

    it('sets day to end of month when original day exceeds new month length', () => {
      const date = CalendarDate.fromISO('2026-01-31')
      const updated = date.set({ month: 2 })
      // February 2026 has 28 days, so day 31 becomes day 28
      expect(updated.year).toEqual(2026)
      expect(updated.month).toEqual(2)
      expect(updated.day).toEqual(28)
    })

    it('does not mutate the original CalendarDate', () => {
      const date = CalendarDate.fromISO('2026-02-07')
      date.set({ year: 2025 })
      expect(date.year).toEqual(2026)
    })
  })

  describe('#hasSame', () => {
    context(
      'when this CalendarDate and the passed CalendarDate share the same specified period (which ' +
        'implies that they share all less granular periods as well, e.g. hasSame "day" implies same month and year)',
      () => {
        it('is true', () => {
          const calendarDate = CalendarDate.fromISO('2024-07-18')
          const otherCalendarDate = CalendarDate.fromISO('2024-07-07')
          expect(calendarDate.hasSame(otherCalendarDate, 'month')).toBe(true)
        })
      }
    )

    context(
      'when this CalendarDate and the passed CalendarDate DO NOT share the same specified period',
      () => {
        it('is false', () => {
          const calendarDate = CalendarDate.fromISO('2024-07-18')
          const otherCalendarDate = CalendarDate.fromISO('2024-03-07')
          expect(calendarDate.hasSame(otherCalendarDate, 'month')).toBe(false)
        })
      }
    )
  })

  describe('#weekdayName', () => {
    it('returns monday for a Monday', () => {
      const calendarDate = CalendarDate.fromISO('2026-02-09') // Monday
      expect(calendarDate.weekdayName).toEqual('monday')
    })

    it('returns tuesday for a Tuesday', () => {
      const calendarDate = CalendarDate.fromISO('2026-02-10') // Tuesday
      expect(calendarDate.weekdayName).toEqual('tuesday')
    })

    it('returns wednesday for a Wednesday', () => {
      const calendarDate = CalendarDate.fromISO('2026-02-11') // Wednesday
      expect(calendarDate.weekdayName).toEqual('wednesday')
    })

    it('returns thursday for a Thursday', () => {
      const calendarDate = CalendarDate.fromISO('2026-02-12') // Thursday
      expect(calendarDate.weekdayName).toEqual('thursday')
    })

    it('returns friday for a Friday', () => {
      const calendarDate = CalendarDate.fromISO('2026-02-13') // Friday
      expect(calendarDate.weekdayName).toEqual('friday')
    })

    it('returns saturday for a Saturday', () => {
      const calendarDate = CalendarDate.fromISO('2026-02-14') // Saturday
      expect(calendarDate.weekdayName).toEqual('saturday')
    })

    it('returns sunday for a Sunday', () => {
      const calendarDate = CalendarDate.fromISO('2026-02-08') // Sunday
      expect(calendarDate.weekdayName).toEqual('sunday')
    })
  })
})
