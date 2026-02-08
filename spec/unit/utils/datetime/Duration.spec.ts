import { Duration as LuxonDuration } from 'luxon'
import { Duration, InvalidDuration } from '../../../../src/utils/datetime/Duration.js'

describe('Duration', () => {
  describe('fromObject', () => {
    it('supports microsecond in the object', () => {
      const duration = Duration.fromObject({ seconds: 1, milliseconds: 77, microseconds: 1 })
      expect(duration.microseconds).toBe(1)
      expect(duration.toISO()).toMatch(/1\.077001S/)
    })

    it('accepts microsecond and produces correct toISO with 6 decimal places', () => {
      const duration = Duration.fromObject({ seconds: 44, milliseconds: 77, microseconds: 1 })
      expect(duration.toISO()).toBe('PT44.077001S')
      expect(duration.microseconds).toBe(1)
    })

    it('defaults microsecond to 0 when not provided', () => {
      const duration = Duration.fromObject({ seconds: 44, milliseconds: 77 })
      expect(duration.toISO()).toMatch(/\.077000S/)
      expect(duration.microseconds).toBe(0)
    })

    it('throws InvalidDuration when microsecond is less than 0', () => {
      expect(() => Duration.fromObject({ seconds: 1, microsecond: -1 })).toThrow(InvalidDuration)
    })

    it('normalizes microsecond > 999 into milliseconds and remainder', () => {
      const duration = Duration.fromObject({ seconds: 1, milliseconds: 77, microseconds: 1500 })
      expect(duration.toMillis()).toBe(1078)
      expect(duration.microseconds).toBe(500)
    })

    it('normalizes microsecond 1000 to 1ms and 0µs', () => {
      const duration = Duration.fromObject({ seconds: 1, microsecond: 1000 })
      expect(duration.toMillis()).toBe(1001)
      expect(duration.microseconds).toBe(0)
    })

    it('rounds decimal microseconds', () => {
      const duration = Duration.fromObject({ seconds: 1, microsecond: 1.5 })
      expect(duration.microseconds).toEqual(2)
    })
  })

  describe('fromMillis', () => {
    it('returns Duration with 0 microseconds', () => {
      const duration = Duration.fromMillis(1234)
      expect(duration.toMillis()).toBe(1234)
      expect(duration.microseconds).toBe(0)
    })
  })

  describe('fromMicroseconds', () => {
    it('creates duration with correct milliseconds and microseconds', () => {
      const duration = Duration.fromMicroseconds(1000500)
      expect(duration.toMillis()).toBe(1000)
      expect(duration.microseconds).toBe(500)
    })

    it('round-trips with toMicroseconds', () => {
      const total = 1234567
      const duration = Duration.fromMicroseconds(total)
      expect(duration.toMicroseconds()).toBe(total)
    })

    it('handles sub-millisecond only', () => {
      const duration = Duration.fromMicroseconds(333)
      expect(duration.toMillis()).toBe(0)
      expect(duration.microseconds).toBe(333)
    })
  })

  describe('fromISO', () => {
    it('parses fractional seconds into milliseconds and microseconds (6 digits)', () => {
      const duration = Duration.fromISO('PT1.077001S')
      expect(duration.seconds).toBe(1)
      expect(duration.milliseconds).toBe(77)
      expect(duration.microseconds).toBe(1)
      expect(duration.toISO()).toBe('PT1.077001S')
    })

    it('parses 3-digit fractional part as milliseconds only', () => {
      const duration = Duration.fromISO('PT1.123S')
      expect(duration.milliseconds).toBe(123)
      expect(duration.microseconds).toBe(0)
    })

    it('parses duration with no fractional part (microseconds 0)', () => {
      const duration = Duration.fromISO('PT1H30M5S')
      expect(duration.microseconds).toBe(0)
    })

    it('parses multi-component duration with fractional seconds only (microseconds from S component)', () => {
      const duration = Duration.fromISO('PT1H2M3.123456S')
      expect(duration.toMillis()).toBe(3723123) // 1h + 2m + 3.123s
      expect(duration.milliseconds).toBe(123)
      expect(duration.microseconds).toBe(456)
    })

    it('does not take fractional part from non-seconds component (e.g. PT0.5M)', () => {
      const duration = Duration.fromISO('PT0.5M')
      expect(duration.toMillis()).toBe(30000) // 30 seconds
      expect(duration.microseconds).toBe(0)
    })

    it('parses comma as decimal separator in seconds (ISO 8601 alternative)', () => {
      const duration = Duration.fromISO('PT1,077001S')
      expect(duration.seconds).toBe(1)
      expect(duration.milliseconds).toBe(77)
      expect(duration.microseconds).toBe(1)
    })
  })

  describe('fromISOTime', () => {
    it('parses fractional part into milliseconds and microseconds (6 digits)', () => {
      const duration = Duration.fromISOTime('00:00:01.077001')
      expect(duration.seconds).toBe(1)
      expect(duration.milliseconds).toBe(77)
      expect(duration.microseconds).toBe(1)
    })

    it('parses 3-digit fractional as milliseconds only', () => {
      const duration = Duration.fromISOTime('00:00:01.444')
      expect(duration.milliseconds).toBe(444)
      expect(duration.microseconds).toBe(0)
    })
  })

  describe('toObject', () => {
    it('includes microseconds', () => {
      const duration = Duration.fromObject({ seconds: 1, milliseconds: 100, microseconds: 50 })
      const obj = duration.toObject()
      expect(obj.seconds).toBe(1)
      expect(obj.milliseconds).toBe(100)
      expect(obj.microseconds).toBe(50)
    })

    it('includes microseconds as 0 when not set', () => {
      const duration = Duration.fromMillis(1000)
      expect(duration.toObject().microseconds).toBe(0)
    })
  })

  describe('toISO', () => {
    it('includes microseconds in S part (6 decimal places)', () => {
      const duration = Duration.fromObject({ seconds: 44, milliseconds: 77, microseconds: 1 })
      expect(duration.toISO()).toBe('PT44.077001S')
    })

    it('pads microsecond to 3 digits', () => {
      const duration = Duration.fromObject({ seconds: 0, milliseconds: 0, microseconds: 1 })
      expect(duration.toISO()).toBe('PT0.000001S')
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
    it('returns total duration in microseconds (toMillis * 1000 + microseconds)', () => {
      const duration = Duration.fromObject({ seconds: 1, milliseconds: 500, microseconds: 250 })
      expect(duration.toMicroseconds()).toBe(duration.toMillis() * 1000 + duration.microseconds)
    })

    it('matches fromMicroseconds round-trip', () => {
      const duration = Duration.fromObject({ hours: 1, seconds: 30, milliseconds: 77, microseconds: 1 })
      expect(Duration.fromMicroseconds(duration.toMicroseconds()).toMicroseconds()).toBe(
        duration.toMicroseconds()
      )
    })
  })

  describe('plus', () => {
    it('supports microseconds in duration object', () => {
      const duration = Duration.fromObject({ seconds: 1, microseconds: 100 }).plus({ microseconds: 200 })
      expect(duration.microseconds).toBe(300)
    })

    it('adds microseconds and handles overflow into milliseconds', () => {
      const duration = Duration.fromObject({ seconds: 1, milliseconds: 7, microseconds: 333 }).plus({
        microseconds: 800,
      })
      expect(duration.milliseconds).toBe(8)
      expect(duration.microseconds).toBe(133)
    })

    it('adds two Duration instances with microseconds', () => {
      const duration1 = Duration.fromObject({ seconds: 1, microseconds: 500 })
      const duration2 = Duration.fromObject({ seconds: 2, microseconds: 600 })
      const duration3 = duration1.plus(duration2)
      expect(duration3.seconds).toBe(3)
      expect(duration3.microseconds).toBe(100)
      expect(duration3.milliseconds).toBe(1)
    })
  })

  describe('minus', () => {
    it('supports microseconds in duration object', () => {
      const duration = Duration.fromObject({ seconds: 1, microseconds: 300 }).minus({ microseconds: 100 })
      expect(duration.microseconds).toBe(200)
    })

    it('subtracts microseconds and handles underflow', () => {
      const duration = Duration.fromObject({ seconds: 1, milliseconds: 7, microseconds: 133 }).minus({
        microseconds: 800,
      })
      expect(duration.milliseconds).toBe(6)
      expect(duration.microseconds).toBe(333)
    })

    it('subtracts and handles underflow by borrowing (can produce negative duration)', () => {
      const duration = Duration.fromObject({ seconds: 0, milliseconds: 0, microseconds: 100 }).minus({
        microseconds: 200,
      })
      // Borrow 1 ms: 1100 - 200 = 900 µs, so -1 ms + 900 µs = -100 µs total
      expect(duration.milliseconds).toBe(-1)
      expect(duration.microseconds).toBe(900)
    })
  })

  describe('set', () => {
    it('accepts microsecond in values', () => {
      const duration = Duration.fromObject({ seconds: 1, microseconds: 100 }).set({ microseconds: 500 })
      expect(duration.microseconds).toBe(500)
    })

    it('normalizes microsecond > 999 into milliseconds and remainder', () => {
      const duration = Duration.fromObject({ seconds: 1, milliseconds: 77 }).set({ microseconds: 1500 })
      expect(duration.toMillis()).toBe(1078)
      expect(duration.microseconds).toBe(500)
    })

    context('each unit is actually set when provided', () => {
      it('sets years when years provided', () => {
        const duration = Duration.fromObject({ years: 1 }).set({ years: 3 })
        expect(duration.years).toBe(3)
      })

      it('sets years when year provided', () => {
        const duration = Duration.fromObject({ years: 1 }).set({ year: 3 })
        expect(duration.years).toBe(3)
      })

      it('sets quarters when quarters provided', () => {
        const duration = Duration.fromObject({ quarters: 1 }).set({ quarters: 2 })
        expect(duration.quarters).toBe(2)
      })

      it('sets quarters when quarter provided', () => {
        const duration = Duration.fromObject({ quarters: 1 }).set({ quarter: 4 })
        expect(duration.quarters).toBe(4)
      })

      it('sets months when months provided', () => {
        const duration = Duration.fromObject({ months: 1 }).set({ months: 6 })
        expect(duration.months).toBe(6)
      })

      it('sets months when month provided', () => {
        const duration = Duration.fromObject({ months: 1 }).set({ month: 11 })
        expect(duration.months).toBe(11)
      })

      it('sets weeks when weeks provided', () => {
        const duration = Duration.fromObject({ weeks: 1 }).set({ weeks: 2 })
        expect(duration.weeks).toBe(2)
      })

      it('sets weeks when week provided', () => {
        const duration = Duration.fromObject({ weeks: 1 }).set({ week: 4 })
        expect(duration.weeks).toBe(4)
      })

      it('sets days when days provided', () => {
        const duration = Duration.fromObject({ days: 1 }).set({ days: 10 })
        expect(duration.days).toBe(10)
      })

      it('sets days when day provided', () => {
        const duration = Duration.fromObject({ days: 1 }).set({ day: 15 })
        expect(duration.days).toBe(15)
      })

      it('sets hours when hours provided', () => {
        const duration = Duration.fromObject({ hours: 1 }).set({ hours: 12 })
        expect(duration.hours).toBe(12)
      })

      it('sets hours when hour provided', () => {
        const duration = Duration.fromObject({ hours: 1 }).set({ hour: 8 })
        expect(duration.hours).toBe(8)
      })

      it('sets minutes when minutes provided', () => {
        const duration = Duration.fromObject({ minutes: 1 }).set({ minutes: 45 })
        expect(duration.minutes).toBe(45)
      })

      it('sets minutes when minute provided', () => {
        const duration = Duration.fromObject({ minutes: 1 }).set({ minute: 33 })
        expect(duration.minutes).toBe(33)
      })

      it('sets seconds when seconds provided', () => {
        const duration = Duration.fromObject({ seconds: 1 }).set({ seconds: 30 })
        expect(duration.seconds).toBe(30)
      })

      it('sets seconds when second provided', () => {
        const duration = Duration.fromObject({ seconds: 1 }).set({ second: 59 })
        expect(duration.seconds).toBe(59)
      })

      it('sets milliseconds when milliseconds provided', () => {
        const duration = Duration.fromObject({ milliseconds: 1 }).set({ milliseconds: 250 })
        expect(duration.milliseconds).toBe(250)
      })

      it('sets milliseconds when millisecond provided', () => {
        const duration = Duration.fromObject({ milliseconds: 1 }).set({ millisecond: 777 })
        expect(duration.milliseconds).toBe(777)
      })
    })
  })

  describe('get', () => {
    it("returns microseconds for unit 'microseconds'", () => {
      const duration = Duration.fromObject({ seconds: 1, microseconds: 42 })
      expect(duration.get('microseconds')).toBe(42)
    })

    it("returns 0 for 'microseconds' when not set", () => {
      const duration = Duration.fromMillis(1000)
      expect(duration.get('microseconds')).toBe(0)
    })
  })

  describe('microseconds getter', () => {
    it('returns the microsecond component (0-999)', () => {
      const duration = Duration.fromObject({ seconds: 0, microseconds: 999 })
      expect(duration.microseconds).toBe(999)
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
