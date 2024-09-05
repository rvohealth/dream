import { DateTime } from 'luxon'
import CalendarDate from '../../../src/helpers/CalendarDate'

describe('CalendarDate', () => {
  describe('constructor', () => {
    context('with null', () => {
      it('sets its DateTime to null', () => {
        const calendarDate = new CalendarDate(null)
        expect(calendarDate.toDateTime()).toBeNull()
      })
    })

    context('with a valid DateTime', () => {
      it('sets its DateTime to a valid DateTime', () => {
        const calendarDate = new CalendarDate(DateTime.fromISO('2024-02-29'))
        expect(calendarDate.toDateTime()?.isValid).toBe(true)
        expect(calendarDate.toISO()).toEqual('2024-02-29')
      })
    })

    context('with an invalid DateTime', () => {
      it('sets its DateTime to null', () => {
        const calendarDate = new CalendarDate(DateTime.fromISO('2023-02-29'))
        expect(calendarDate.toDateTime()).toBeNull()
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
      it('sets its DateTime to null', () => {
        const calendarDate = new CalendarDate(2023, 2, 29)
        expect(calendarDate.toDateTime()).toBeNull()
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
      jest.spyOn(CalendarDate, 'today').mockReturnValue(CalendarDate.fromISO('2023-12-31'))
      const tomorrow = CalendarDate.tomorrow()
      expect(tomorrow.toISO()).toEqual('2024-01-01')
    })
  })

  describe('.yesterday', () => {
    it('is today minus 1 day ', () => {
      jest.spyOn(CalendarDate, 'today').mockReturnValue(CalendarDate.fromISO('2024-01-01'))
      const yesterday = CalendarDate.yesterday()
      expect(yesterday.toISO()).toEqual('2023-12-31')
    })
  })

  describe('.fromISO', () => {
    it('creates a valid CalendarDate', () => {
      const calendarDate = CalendarDate.fromISO('2024-03-02')
      expect(calendarDate.isValid).toBe(true)
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
      it('creates an invalid CalendarDate', () => {
        const calendarDate = CalendarDate.fromISO('2023-02-29')
        expect(calendarDate.isValid).toBe(false)
      })
    })
  })

  describe('.fromSQL', () => {
    it('creates a valid CalendarDate', () => {
      const calendarDate = CalendarDate.fromSQL('2024-03-02')
      expect(calendarDate.isValid).toBe(true)
    })

    context('with an invalid date string', () => {
      it('creates an invalid CalendarDate', () => {
        const calendarDate = CalendarDate.fromSQL('2023-02-29')
        expect(calendarDate.isValid).toBe(false)
      })
    })
  })

  describe('.fromObject', () => {
    it('creates a valid CalendarDate', () => {
      const calendarDate = CalendarDate.fromObject({ year: 2023, month: 6, day: 16 })
      expect(calendarDate.isValid).toBe(true)
    })

    context('with an invalid date', () => {
      it('creates an invalid CalendarDate', () => {
        const calendarDate = CalendarDate.fromObject({ year: 2023, month: 2, day: 29 })
        expect(calendarDate.isValid).toBe(false)
      })
    })
  })

  describe('#toISO', () => {
    it('returns a YYYY-MM-DD string', () => {
      const calendarDate = CalendarDate.fromISO('2024-03-02')
      expect(calendarDate.toISO()).toEqual('2024-03-02')
    })

    context('with an invalid date string', () => {
      it('returns null', () => {
        const calendarDate = CalendarDate.fromISO('2023-02-29')
        expect(calendarDate.toISO()).toBeNull()
      })
    })
  })

  describe('#toSQL', () => {
    it('returns a YYYY-MM-DD string', () => {
      const calendarDate = CalendarDate.fromISO('2024-03-02')
      expect(calendarDate.toSQL()).toEqual('2024-03-02')
    })

    context('with an invalid date string', () => {
      it('returns null', () => {
        const calendarDate = CalendarDate.fromISO('2023-02-29')
        expect(calendarDate.toSQL()).toBeNull()
      })
    })
  })

  describe('#toISODate', () => {
    it('aliases toISO', () => {
      const calendarDate = CalendarDate.today()
      jest.spyOn(calendarDate, 'toISO').mockReturnValue('hello world')
      expect(calendarDate.toISODate()).toEqual('hello world')
    })
  })

  describe('#toJSON', () => {
    it('aliases toISO', () => {
      const calendarDate = CalendarDate.today()
      jest.spyOn(calendarDate, 'toISO').mockReturnValue('hello world')
      expect(calendarDate.toJSON()).toEqual('hello world')
    })
  })

  describe('#valueOf', () => {
    it('aliases toISO', () => {
      const calendarDate = CalendarDate.today()
      jest.spyOn(calendarDate, 'toISO').mockReturnValue('hello world')
      expect(calendarDate.valueOf()).toEqual('hello world')
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
      jest.spyOn(calendarDate, 'toISO').mockReturnValue('hello world')
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

    context('on an invalid CalendarDate', () => {
      it('returns an invalid CalendarDate', () => {
        const calendarDate = CalendarDate.newInvalidDate()
        expect(calendarDate.plus({ days: 4 })).toEqualCalendarDate(CalendarDate.newInvalidDate())
      })
    })
  })

  describe('#minus', () => {
    it('subtracts the number of days from the date, accounting for leap year', () => {
      const calendarDate = CalendarDate.fromISO('2024-03-02')
      expect(calendarDate.minus({ days: 4 })).toEqualCalendarDate(CalendarDate.fromISO('2024-02-27'))
    })

    context('on an invalid CalendarDate', () => {
      it('returns an invalid CalendarDate', () => {
        const calendarDate = CalendarDate.newInvalidDate()
        expect(calendarDate.minus({ days: 4 })).toEqualCalendarDate(CalendarDate.newInvalidDate())
      })
    })
  })

  describe('.max', () => {
    it('is the larger of the two CalendarDates', () => {
      const calendarDate = CalendarDate.fromISO('2024-02-27')
      const otherCalendarDate = CalendarDate.fromISO('2024-03-02')
      expect(CalendarDate.max(calendarDate, otherCalendarDate)).toEqualCalendarDate(otherCalendarDate)
    })

    context('on an invalid CalendarDate', () => {
      it('returns an invalid CalendarDate', () => {
        const calendarDate = CalendarDate.newInvalidDate()
        const otherCalendarDate = CalendarDate.fromISO('2024-03-02')
        expect(CalendarDate.max(calendarDate, otherCalendarDate)).toEqualCalendarDate(
          CalendarDate.newInvalidDate()
        )
      })
    })

    context('with an invalid CalendarDate', () => {
      it('returns an invalid CalendarDate', () => {
        const calendarDate = CalendarDate.fromISO('2024-03-02')
        const otherCalendarDate = CalendarDate.newInvalidDate()
        expect(CalendarDate.max(calendarDate, otherCalendarDate)).toEqualCalendarDate(
          CalendarDate.newInvalidDate()
        )
      })
    })
  })

  describe('.min', () => {
    it('is the larger of the two CalendarDates', () => {
      const calendarDate = CalendarDate.fromISO('2024-02-27')
      const otherCalendarDate = CalendarDate.fromISO('2024-03-02')
      expect(CalendarDate.min(calendarDate, otherCalendarDate)).toEqualCalendarDate(calendarDate)
    })

    context('on an invalid CalendarDate', () => {
      it('returns an invalid CalendarDate', () => {
        const calendarDate = CalendarDate.newInvalidDate()
        const otherCalendarDate = CalendarDate.fromISO('2024-03-02')
        expect(CalendarDate.min(calendarDate, otherCalendarDate)).toEqualCalendarDate(
          CalendarDate.newInvalidDate()
        )
      })
    })

    context('with an invalid CalendarDate', () => {
      it('returns an invalid CalendarDate', () => {
        const calendarDate = CalendarDate.fromISO('2024-03-02')
        const otherCalendarDate = CalendarDate.newInvalidDate()
        expect(CalendarDate.min(calendarDate, otherCalendarDate)).toEqualCalendarDate(
          CalendarDate.newInvalidDate()
        )
      })
    })
  })

  describe('#diff', () => {
    context('when the date is greater than the other date', () => {
      it('the positive difference in the specified units', () => {
        const calendarDate = CalendarDate.fromISO('2024-03-02')
        const otherCalendarDate = CalendarDate.fromISO('2024-02-27')
        expect(calendarDate.diff(otherCalendarDate, 'days')).toEqual(4)
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

    context('on an invalid CalendarDate', () => {
      it('returns an invalid CalendarDate', () => {
        const calendarDate = CalendarDate.newInvalidDate()
        const otherCalendarDate = CalendarDate.fromISO('2024-02-27')
        expect(calendarDate.diff(otherCalendarDate, 'days')).toBeNull()
      })
    })

    context('with an invalid CalendarDate', () => {
      it('returns an invalid CalendarDate', () => {
        const calendarDate = CalendarDate.fromISO('2024-03-02')
        const otherCalendarDate = CalendarDate.newInvalidDate()
        expect(calendarDate.diff(otherCalendarDate, 'days')).toBeNull()
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

    context('on an invalid CalendarDate', () => {
      it('returns an invalid CalendarDate', () => {
        const calendarDate = CalendarDate.newInvalidDate()
        const otherCalendarDate = CalendarDate.fromISO('2024-02-27')
        expect(calendarDate < otherCalendarDate).toBe(false)
      })
    })

    context('with an invalid CalendarDate', () => {
      it('returns an invalid CalendarDate', () => {
        const calendarDate = CalendarDate.fromISO('2024-03-02')
        const otherCalendarDate = CalendarDate.newInvalidDate()
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

    context('on an invalid CalendarDate', () => {
      it('returns an invalid CalendarDate', () => {
        const calendarDate = CalendarDate.newInvalidDate()
        const otherCalendarDate = CalendarDate.fromISO('2024-02-27')
        expect(calendarDate > otherCalendarDate).toBe(false)
      })
    })

    context('with an invalid CalendarDate', () => {
      it('returns an invalid CalendarDate', () => {
        const calendarDate = CalendarDate.fromISO('2024-03-02')
        const otherCalendarDate = CalendarDate.newInvalidDate()
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

    context('on an invalid CalendarDate', () => {
      it('returns an invalid CalendarDate', () => {
        const calendarDate = CalendarDate.newInvalidDate()
        expect(calendarDate.diffNow('days')).toBeNull()
      })
    })
  })

  describe('#isValid getter', () => {
    context('on an valid CalendarDate', () => {
      it('is true', () => {
        const calendarDate = CalendarDate.fromISO('2024-02-27')
        expect(calendarDate.isValid).toBe(true)
      })
    })

    context('on an invalid CalendarDate', () => {
      it('is false', () => {
        const calendarDate = CalendarDate.newInvalidDate()
        expect(calendarDate.isValid).toBe(false)
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
    it('creates a valid CalendarDate', () => {
      const calendarDate = CalendarDate.fromJSDate(new Date('2024-03-02'))
      expect(calendarDate.isValid).toBe(true)
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

    context('with an invalid date string', () => {
      it('creates an invalid CalendarDate', () => {
        const calendarDate = CalendarDate.fromISO('2023-02-29')
        expect(calendarDate.isValid).toBe(false)
      })
    })
  })

  describe('#startOf', () => {
    it('returns a CalendarDate at the beginning of the specified time period', () => {
      const calendarDate = CalendarDate.fromISO('2024-07-18')
      expect(calendarDate.startOf('month')).toEqualCalendarDate(CalendarDate.fromISO('2024-07-01'))
    })

    context('on an invalid CalendarDate', () => {
      it('returns an invalid CalendarDate', () => {
        const calendarDate = CalendarDate.fromISO('2023-02-29')
        expect(calendarDate.startOf('month').isValid).toBe(false)
      })
    })
  })

  describe('#endOf', () => {
    it('returns a CalendarDate at the beginning of the specified time period', () => {
      const calendarDate = CalendarDate.fromISO('2024-07-18')
      expect(calendarDate.endOf('month')).toEqualCalendarDate(CalendarDate.fromISO('2024-07-31'))
    })

    context('on an invalid CalendarDate', () => {
      it('returns an invalid CalendarDate', () => {
        const calendarDate = CalendarDate.fromISO('2023-02-29')
        expect(calendarDate.endOf('month').isValid).toBe(false)
      })
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

    context('on an invalid CalendarDate', () => {
      it('is false', () => {
        const calendarDate = CalendarDate.newInvalidDate()
        const otherCalendarDate = CalendarDate.fromISO('2024-02-27')
        expect(calendarDate.hasSame(otherCalendarDate, 'day')).toBe(false)
      })
    })

    context('with an invalid CalendarDate', () => {
      it('is false', () => {
        const calendarDate = CalendarDate.fromISO('2024-03-02')
        const otherCalendarDate = CalendarDate.newInvalidDate()
        expect(calendarDate.hasSame(otherCalendarDate, 'day')).toBe(false)
      })
    })
  })
})
