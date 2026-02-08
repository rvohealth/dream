import CalendarDate, { InvalidCalendarDate } from '../../../src/utils/datetime/CalendarDate.js'
import { DateTime } from '../../../src/utils/datetime/DateTime.js'

describe('CalendarDate', () => {
  describe('constructor', () => {
    context('without an argument', () => {
      it('sets itself to today', () => {
        const calendarDate = new CalendarDate()
        expect(calendarDate).toEqualCalendarDate(CalendarDate.today())
      })
    })

    context('with null', () => {
      it('sets itself to today', () => {
        const calendarDate = new CalendarDate(null)
        expect(calendarDate).toEqualCalendarDate(CalendarDate.today())
      })
    })

    context('with a valid DateTime', () => {
      it('sets its DateTime to a valid DateTime', () => {
        const calendarDate = new CalendarDate(DateTime.fromISO('2024-02-29'))
        expect(calendarDate.toDateTime()?.isValid).toBe(true)
        expect(calendarDate.toISO()).toEqual('2024-02-29')
      })
    })

    context('with a valid series of year, month, day numbers', () => {
      it('sets its DateTime to a valid DateTime', () => {
        const calendarDate = new CalendarDate(2024, 2, 29)
        expect(calendarDate.toDateTime()?.isValid).toBe(true)
        expect(calendarDate.toISO()).toEqual('2024-02-29')
      })
    })

    context('with an invalid series of year, month, day numbers', () => {
      it('throws InvalidCalendarDate', () => {
        expect(() => new CalendarDate(2023, 2, 29)).toThrow(InvalidCalendarDate)
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

      context('when passed an explicit timezone override that changes the date to a different date', () => {
        it('it is the date in the specified timezone', () => {
          const calendarDate = CalendarDate.fromISO('2024-05-05T22:43:36.032-05:00', { zone: 'UTC' })
          expect(calendarDate.toISO()).toEqual('2024-05-06')
        })
      })

      context(
        'when passed an explicit timezone override that does not change the date to a different date',
        () => {
          it('it is the date in the specified timezone', () => {
            const calendarDate = CalendarDate.fromISO('2024-05-05T22:43:36.032-05:00', {
              zone: 'America/Chicago',
            })
            expect(calendarDate.toISO()).toEqual('2024-05-05')
          })
        }
      )
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
    it('gets milliseconds', () => {
      const calendarDate = CalendarDate.fromISO('2025-10-12')
      expect(calendarDate.valueOf()).toEqual(1760227200000)
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
    context('when the date is greater than the other date', () => {
      it('the positive difference in the specified units', () => {
        const calendarDate = CalendarDate.fromISO('2024-03-02')
        const otherCalendarDate = CalendarDate.fromISO('2024-02-27')
        const diff = calendarDate.diff(otherCalendarDate, 'days')
        expect(diff).toEqual(4)
      })

      context('across daylight savings time', () => {
        it('is the correct integer amount', () => {
          const calendarDate = CalendarDate.fromISO('2024-03-11')
          const otherCalendarDate = CalendarDate.fromISO('2024-03-10')
          expect(calendarDate.diff(otherCalendarDate, 'days')).toEqual(1)
        })
      })
    })

    context('when the date is less than the other date', () => {
      it('the negative difference in the specified units', () => {
        const calendarDate = CalendarDate.fromISO('2024-02-27')
        const otherCalendarDate = CalendarDate.fromISO('2024-03-02')
        expect(calendarDate.diff(otherCalendarDate, 'days')).toEqual(-4)
      })

      context('across daylight savings time', () => {
        it('is the correct, negative integer amount', () => {
          const calendarDate = CalendarDate.fromISO('2024-03-10')
          const otherCalendarDate = CalendarDate.fromISO('2024-03-11')
          expect(calendarDate.diff(otherCalendarDate, 'days')).toEqual(-1)
        })
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
    context('when the date is greater than now', () => {
      it('the positive difference in the specified units', () => {
        const calendarDate = CalendarDate.today().plus({ days: 7 })
        expect(calendarDate.diffNow('days')).toEqual(7)
      })
    })

    context('when the date is less than now', () => {
      it('the negative difference in the specified units', () => {
        const calendarDate = CalendarDate.today().minus({ days: 7 })
        expect(calendarDate.diffNow('days')).toEqual(-7)
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
})
