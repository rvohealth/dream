import { Duration as LuxonDuration } from 'luxon'
import { Duration } from '../../../../src/utils/datetime/Duration.js'

describe('Duration', () => {
  describe('fromObject', () => {
    it('supports microsecond in the object', () => {
      const duration = Duration.fromObject({ seconds: 1, milliseconds: 77, microseconds: 1 })
      expect(duration.microseconds).toEqual(1)
      expect(duration.toISO()).toEqual('PT1.077001S')
    })

    it('accepts microsecond and produces correct toISO with 6 decimal places', () => {
      const duration = Duration.fromObject({ seconds: 44, milliseconds: 77, microseconds: 1 })
      expect(duration.toISO()).toEqual('PT44.077001S')
      expect(duration.microseconds).toEqual(1)
    })

    it('defaults microsecond to 0 when not provided', () => {
      const duration = Duration.fromObject({ seconds: 44, milliseconds: 77 })
      expect(duration.toISO()).toEqual('PT44.077000S')
      expect(duration.microseconds).toEqual(0)
    })

    it('normalizes microsecond > 999 into milliseconds and remainder', () => {
      const duration = Duration.fromObject({ seconds: 1, milliseconds: 77, microseconds: 1500 })
      expect(duration.seconds).toEqual(1)
      expect(duration.milliseconds).toEqual(78)
      expect(duration.microseconds).toEqual(500)
    })

    it('normalizes microsecond 1000 to 1ms and 0µs', () => {
      const duration = Duration.fromObject({ seconds: 3, microsecond: 1000 })
      expect(duration.seconds).toEqual(3)
      expect(duration.milliseconds).toEqual(1)
      expect(duration.microseconds).toEqual(0)
    })

    it('rounds decimal microseconds', () => {
      const duration = Duration.fromObject({ seconds: 1, microsecond: 1.5 })
      expect(duration.microseconds).toEqual(2)
    })
  })

  describe('fromMillis', () => {
    it('returns Duration with 0 microseconds', () => {
      const duration = Duration.fromMillis(1234)
      expect(duration.milliseconds).toEqual(1234)
      expect(duration.microseconds).toEqual(0)
    })
  })

  describe('fromMicroseconds', () => {
    it('creates a Duration from total microseconds', () => {
      const duration = Duration.fromMicroseconds(1000500)
      expect(duration.toISO()).toEqual('PT1.000500S')
      expect(duration.microseconds).toEqual(500)
    })

    it('rounds microseconds', () => {
      const duration = Duration.fromMicroseconds(1000500.5)
      expect(duration.toISO()).toEqual('PT1.000501S')
      expect(duration.microseconds).toEqual(501)
    })

    it('round-trips with toMicroseconds', () => {
      const total = 1234567
      const duration = Duration.fromMicroseconds(total)
      expect(duration.toMicroseconds()).toEqual(total)
    })

    it('handles values with only a sub-millisecond part', () => {
      const duration = Duration.fromMicroseconds(333)
      expect(duration.milliseconds).toEqual(0)
      expect(duration.microseconds).toEqual(333)
    })
  })

  describe('fromISO', () => {
    it('parses fractional seconds into milliseconds and microseconds (6 digits)', () => {
      const duration = Duration.fromISO('PT1.077001S')
      expect(duration.seconds).toEqual(1)
      expect(duration.milliseconds).toEqual(77)
      expect(duration.microseconds).toEqual(1)
      expect(duration.toISO()).toEqual('PT1.077001S')
    })

    it('parses 3-digit fractional part as milliseconds only', () => {
      const duration = Duration.fromISO('PT1.123S')
      expect(duration.milliseconds).toEqual(123)
      expect(duration.microseconds).toEqual(0)
      expect(duration.toISO()).toEqual('PT1.123000S')
    })

    it('parses duration with no fractional part (microseconds 0)', () => {
      const duration = Duration.fromISO('PT1H30M5S')
      expect(duration.microseconds).toEqual(0)
      expect(duration.toISO()).toEqual('PT1H30M5S')
    })

    it('parses multi-component duration with fractional seconds only (microseconds from S component)', () => {
      const duration = Duration.fromISO('PT1H2M3.123456S')
      expect(duration.milliseconds).toEqual(123)
      expect(duration.microseconds).toEqual(456)
      expect(duration.toISO()).toEqual('PT1H2M3.123456S')
    })

    it('parses comma as decimal separator in seconds (ISO 8601 alternative)', () => {
      const duration = Duration.fromISO('PT1,077001S')
      expect(duration.seconds).toEqual(1)
      expect(duration.milliseconds).toEqual(77)
      expect(duration.microseconds).toEqual(1)
      expect(duration.toISO()).toEqual('PT1.077001S')
    })
  })

  describe('fromISOTime', () => {
    it('parses fractional part into milliseconds and microseconds (6 digits)', () => {
      const duration = Duration.fromISOTime('00:00:01.077001')
      expect(duration.seconds).toEqual(1)
      expect(duration.milliseconds).toEqual(77)
      expect(duration.microseconds).toEqual(1)
    })

    it('parses 3-digit fractional as milliseconds only', () => {
      const duration = Duration.fromISOTime('00:00:01.444')
      expect(duration.milliseconds).toEqual(444)
      expect(duration.microseconds).toEqual(0)
    })
  })

  describe('toObject', () => {
    it('includes microseconds', () => {
      const duration = Duration.fromObject({ seconds: 1, milliseconds: 100, microseconds: 50 })
      const obj = duration.toObject()
      expect(obj.seconds).toEqual(1)
      expect(obj.milliseconds).toEqual(100)
      expect(obj.microseconds).toEqual(50)
    })

    it('includes microseconds as 0 when not set', () => {
      const duration = Duration.fromMillis(1000)
      expect(duration.toObject().microseconds).toEqual(0)
    })
  })

  describe('toISO', () => {
    it('includes microseconds in S part (6 decimal places)', () => {
      const duration = Duration.fromObject({ seconds: 44, milliseconds: 77, microseconds: 1 })
      expect(duration.toISO()).toEqual('PT44.077001S')
    })

    it('pads microsecond to 3 digits', () => {
      const duration = Duration.fromObject({ seconds: 0, milliseconds: 0, microseconds: 1 })
      expect(duration.toISO()).toEqual('PT0.000001S')
    })
  })

  describe('toMillis', () => {
    it('includes microseconds as fractional part', () => {
      const duration = Duration.fromObject({ seconds: 1, milliseconds: 77, microseconds: 750 })
      expect(duration.toMillis()).toEqual(1077.75)
      expect(duration.toMillis().toString()).toEqual('1077.75')
    })
  })

  describe('toISOTime', () => {
    it('outputs 6 decimal places for sub-second part', () => {
      const duration = Duration.fromObject({
        hours: 0,
        minutes: 0,
        seconds: 3,
        milliseconds: 77,
        microseconds: 1,
      })
      expect(duration.toISOTime()).toEqual('00:00:03.077001')
    })

    context('with suppressMilliseconds option', () => {
      context('when milliseconds is non-zero and microseconds are zero', () => {
        it('outputs 6 decimal places for sub-second part', () => {
          const duration = Duration.fromObject({
            hours: 0,
            minutes: 0,
            seconds: 1,
            milliseconds: 7,
            microseconds: 0,
          })
          expect(duration.toISOTime({ suppressMilliseconds: true })).toEqual('00:00:01.007000')
        })
      })

      context('when milliseconds are zero and microseconds are non-zero', () => {
        it('outputs 6 decimal places for sub-second part', () => {
          const duration = Duration.fromObject({
            hours: 0,
            minutes: 0,
            seconds: 1,
            milliseconds: 0,
            microseconds: 7,
          })
          expect(duration.toISOTime({ suppressMilliseconds: true })).toEqual('00:00:01.000007')
        })
      })

      context('when the milliseconds and microseconds are zero', () => {
        it('omits the milliseconds part', () => {
          const duration = Duration.fromObject({
            hours: 0,
            minutes: 0,
            seconds: 1,
            milliseconds: 0,
            microseconds: 0,
          })
          expect(duration.toISOTime({ suppressMilliseconds: true })).toEqual('00:00:01')
        })
      })
    })
  })

  describe('toMicroseconds', () => {
    it('returns total duration in microseconds', () => {
      const duration = Duration.fromObject({ seconds: 1, milliseconds: 500, microseconds: 250 })
      expect(duration.toMicroseconds()).toEqual(1500250)
    })

    it('matches fromMicroseconds round-trip', () => {
      const duration = Duration.fromObject({ hours: 1, seconds: 30, milliseconds: 77, microseconds: 1 })
      expect(Duration.fromMicroseconds(duration.toMicroseconds()).toMicroseconds()).toEqual(
        duration.toMicroseconds()
      )
    })
  })

  describe('plus', () => {
    it('supports microseconds in duration object', () => {
      const duration = Duration.fromObject({ seconds: 1, microseconds: 100 }).plus({ microseconds: 200 })
      expect(duration.microseconds).toEqual(300)
    })

    it('adds microseconds and handles overflow into milliseconds', () => {
      const duration = Duration.fromObject({ seconds: 1, milliseconds: 7, microseconds: 333 }).plus({
        microseconds: 800,
      })
      expect(duration.milliseconds).toEqual(8)
      expect(duration.microseconds).toEqual(133)
    })

    it('adds two Duration instances with microseconds', () => {
      const duration1 = Duration.fromObject({ seconds: 1, microseconds: 500 })
      const duration2 = Duration.fromObject({ seconds: 2, microseconds: 600 })
      const duration3 = duration1.plus(duration2)
      expect(duration3.seconds).toEqual(3)
      expect(duration3.microseconds).toEqual(100)
      expect(duration3.milliseconds).toEqual(1)
    })
  })

  describe('minus', () => {
    it('supports microseconds in duration object', () => {
      const duration = Duration.fromObject({ seconds: 1, microseconds: 300 }).minus({ microseconds: 100 })
      expect(duration.microseconds).toEqual(200)
    })

    it('subtracts microseconds and handles underflow', () => {
      const duration = Duration.fromObject({ seconds: 1, milliseconds: 7, microseconds: 133 }).minus({
        microseconds: 800,
      })
      expect(duration.milliseconds).toEqual(6)
      expect(duration.microseconds).toEqual(333)
    })

    it('subtracts and handles underflow by borrowing (can produce negative duration)', () => {
      const duration = Duration.fromObject({ seconds: 0, milliseconds: 0, microseconds: 100 }).minus({
        microseconds: 200,
      })
      // Borrow 1 ms: 1100 - 200 = 900 µs, so -1 ms + 900 µs = -100 µs total
      expect(duration.milliseconds).toEqual(-1)
      expect(duration.microseconds).toEqual(900)
    })
  })

  describe('set', () => {
    it('accepts microsecond in values', () => {
      const duration = Duration.fromObject({ seconds: 1, microseconds: 100 }).set({ microseconds: 500 })
      expect(duration.microseconds).toEqual(500)
    })

    it('normalizes microsecond > 999 into milliseconds and remainder', () => {
      const duration = Duration.fromObject({ seconds: 1, milliseconds: 77 }).set({ microseconds: 1500 })
      expect(duration.seconds).toEqual(1)
      expect(duration.milliseconds).toEqual(78)
      expect(duration.microseconds).toEqual(500)
    })

    context('each unit is actually set when provided', () => {
      it('sets years when years provided', () => {
        const duration = Duration.fromObject({ years: 1 }).set({ years: 3 })
        expect(duration.years).toEqual(3)
      })

      it('sets years when year provided', () => {
        const duration = Duration.fromObject({ years: 1 }).set({ year: 3 })
        expect(duration.years).toEqual(3)
      })

      it('sets quarters when quarters provided', () => {
        const duration = Duration.fromObject({ quarters: 1 }).set({ quarters: 2 })
        expect(duration.quarters).toEqual(2)
      })

      it('sets quarters when quarter provided', () => {
        const duration = Duration.fromObject({ quarters: 1 }).set({ quarter: 4 })
        expect(duration.quarters).toEqual(4)
      })

      it('sets months when months provided', () => {
        const duration = Duration.fromObject({ months: 1 }).set({ months: 6 })
        expect(duration.months).toEqual(6)
      })

      it('sets months when month provided', () => {
        const duration = Duration.fromObject({ months: 1 }).set({ month: 11 })
        expect(duration.months).toEqual(11)
      })

      it('sets weeks when weeks provided', () => {
        const duration = Duration.fromObject({ weeks: 1 }).set({ weeks: 2 })
        expect(duration.weeks).toEqual(2)
      })

      it('sets weeks when week provided', () => {
        const duration = Duration.fromObject({ weeks: 1 }).set({ week: 4 })
        expect(duration.weeks).toEqual(4)
      })

      it('sets days when days provided', () => {
        const duration = Duration.fromObject({ days: 1 }).set({ days: 10 })
        expect(duration.days).toEqual(10)
      })

      it('sets days when day provided', () => {
        const duration = Duration.fromObject({ days: 1 }).set({ day: 15 })
        expect(duration.days).toEqual(15)
      })

      it('sets hours when hours provided', () => {
        const duration = Duration.fromObject({ hours: 1 }).set({ hours: 12 })
        expect(duration.hours).toEqual(12)
      })

      it('sets hours when hour provided', () => {
        const duration = Duration.fromObject({ hours: 1 }).set({ hour: 8 })
        expect(duration.hours).toEqual(8)
      })

      it('sets minutes when minutes provided', () => {
        const duration = Duration.fromObject({ minutes: 1 }).set({ minutes: 45 })
        expect(duration.minutes).toEqual(45)
      })

      it('sets minutes when minute provided', () => {
        const duration = Duration.fromObject({ minutes: 1 }).set({ minute: 33 })
        expect(duration.minutes).toEqual(33)
      })

      it('sets seconds when seconds provided', () => {
        const duration = Duration.fromObject({ seconds: 1 }).set({ seconds: 30 })
        expect(duration.seconds).toEqual(30)
      })

      it('sets seconds when second provided', () => {
        const duration = Duration.fromObject({ seconds: 1 }).set({ second: 59 })
        expect(duration.seconds).toEqual(59)
      })

      it('sets milliseconds when milliseconds provided', () => {
        const duration = Duration.fromObject({ milliseconds: 1 }).set({ milliseconds: 250 })
        expect(duration.milliseconds).toEqual(250)
      })

      it('sets milliseconds when millisecond provided', () => {
        const duration = Duration.fromObject({ milliseconds: 1 }).set({ millisecond: 777 })
        expect(duration.milliseconds).toEqual(777)
      })
    })
  })

  describe('get', () => {
    it("returns microseconds for unit 'microseconds'", () => {
      const duration = Duration.fromObject({ seconds: 1, microseconds: 42 })
      expect(duration.get('microseconds')).toEqual(42)
    })

    it("returns 0 for 'microseconds' when not set", () => {
      const duration = Duration.fromMillis(1000)
      expect(duration.get('microseconds')).toEqual(0)
    })
  })

  describe('microseconds getter', () => {
    it('returns the microsecond component (0-999)', () => {
      const duration = Duration.fromObject({ seconds: 0, microseconds: 999 })
      expect(duration.microseconds).toEqual(999)
    })
  })

  describe('is our Duration', () => {
    it('is instance of Luxon Duration', () => {
      const duration = Duration.fromObject({ seconds: 1 })
      expect(duration).toBeInstanceOf(LuxonDuration)
    })

    it('is instance of our Duration', () => {
      const duration = Duration.fromObject({ seconds: 1 })
      expect(duration).toBeInstanceOf(Duration)
    })
  })
})
