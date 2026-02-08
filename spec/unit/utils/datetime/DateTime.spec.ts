import { DateTime, InvalidDateTime } from '../../../../src/utils/datetime/DateTime.js'

describe('DateTime', () => {
  describe('fromObject', () => {
    it('supports microsecond in the object', () => {
      const datetime = DateTime.fromObject(
        { year: 2026, month: 2, day: 7, hour: 9, minute: 3, second: 44, millisecond: 77, microsecond: 1 },
        { zone: 'utc' }
      )
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
    it('supports microsecond in ISO fractional part (6 digits)', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.077001Z')
      expect(datetime.millisecond).toEqual(77)
      expect(datetime.microsecond).toEqual(1)
    })

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
    it('supports microsecond in SQL fractional part', () => {
      const datetime = DateTime.fromSQL('2026-02-07 09:03:44.077001')
      expect(datetime.millisecond).toEqual(77)
      expect(datetime.microsecond).toEqual(1)
    })

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

  describe('fromMillis', () => {
    it('returns DateTime with microseconds 0', () => {
      const datetime = DateTime.fromMillis(1707282224077)
      expect(datetime.microsecond).toEqual(0)
    })
  })

  describe('fromMicroseconds', () => {
    it('supports microsecond precision from epoch microseconds', () => {
      const datetime = DateTime.fromMicroseconds(1707282224077001)
      expect(datetime.toMillis()).toEqual(1707282224077)
      expect(datetime.microsecond).toEqual(1)
    })

    it('returns DateTime with correct milliseconds and microseconds from epoch microseconds', () => {
      const datetime = DateTime.fromMicroseconds(1707282224077001)
      expect(datetime.toMillis()).toEqual(1707282224077)
      expect(datetime.microsecond).toEqual(1)
    })

    it('accepts optional zone options', () => {
      const datetime = DateTime.fromMicroseconds(1707282224077001, { zone: 'utc' })
      expect(datetime.zoneName).toEqual('UTC')
      expect(datetime.microsecond).toEqual(1)
    })
  })

  describe('fromSeconds', () => {
    it('returns DateTime with microseconds 0', () => {
      const datetime = DateTime.fromSeconds(1707282224.077)
      expect(datetime.microsecond).toEqual(0)
    })
  })

  describe('fromJSDate', () => {
    it('returns DateTime with microseconds 0', () => {
      const datetime = DateTime.fromJSDate(new Date('2026-02-07T09:03:44.077Z'))
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
    it('supports microsecond as 8th argument', () => {
      const datetime = DateTime.utc(2026, 2, 7, 9, 3, 44, 77, 1)
      expect(datetime.microsecond).toEqual(1)
      expect(datetime.toISO()).toEqual('2026-02-07T09:03:44.077001Z')
    })

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
      expect(datetime.toISOTime()).toEqual('09:03:44.077001Z')
    })
  })

  describe('toMicroseconds', () => {
    it('returns epoch microseconds equivalent to toMillis * 1000 + microseconds', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.077001Z')
      expect(datetime.toMicroseconds()).toEqual(datetime.toMillis() * 1000 + datetime.microsecond)
    })

    it('round-trips with fromMicroseconds', () => {
      const epochMicros = 1707282224077001
      const datetime = DateTime.fromMicroseconds(epochMicros)
      expect(datetime.toMicroseconds()).toEqual(epochMicros)
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

    it('normalizes microseconds > 999 in duration into milliseconds and remainder', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.007000Z').plus({ microseconds: 1500 })
      expect(datetime.millisecond).toEqual(8)
      expect(datetime.microsecond).toEqual(500)
    })
  })

  describe('set', () => {
    it('supports microsecond in values', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.077001Z').set({ microsecond: 500 })
      expect(datetime.microsecond).toEqual(500)
    })

    it('accepts microsecond and updates microseconds', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.077001').set({ microsecond: 500 })
      expect(datetime.microsecond).toEqual(500)
      expect(datetime.toISO()).toEqual('2026-02-07T09:03:44.077500Z')
    })

    it('normalizes microsecond > 999 into milliseconds and remainder', () => {
      const datetime = DateTime.fromISO('2026-02-07T09:03:44.077000Z').set({ microsecond: 1500 })
      expect(datetime.millisecond).toEqual(78)
      expect(datetime.microsecond).toEqual(500)
    })
  })

  describe('toObject', () => {
    it('includes microsecond in the result', () => {
      const datetime = DateTime.fromObject({
        year: 2026,
        month: 2,
        day: 7,
        microsecond: 42,
      })
      const obj = datetime.toObject()
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
      const min = DateTime.min(a, b)
      expect(min != null && min.equals(a)).toEqual(true)
      expect(DateTime.min(b, a) != null && DateTime.min(b, a)!.equals(a)).toEqual(true)
    })
  })

  describe('max', () => {
    it('returns the maximum DateTime (comparison includes microseconds)', () => {
      const a = DateTime.fromISO('2026-02-07T09:03:44.077001Z')
      const b = DateTime.fromISO('2026-02-07T09:03:44.077002Z')
      const max = DateTime.max(a, b)
      expect(max != null && max.equals(b)).toEqual(true)
      expect(DateTime.max(b, a) != null && DateTime.max(b, a)!.equals(b)).toEqual(true)
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
})
