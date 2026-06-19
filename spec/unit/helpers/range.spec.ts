import range, { type Range } from '../../../src/helpers/range.js'
import { ClockTime, ClockTimeTz } from '../../../src/package-exports/index.js'
import CalendarDate from '../../../src/utils/datetime/CalendarDate.js'
import { DateTime } from '../../../src/utils/datetime/DateTime.js'

describe('range', () => {
  it('captures begin, end, and excludeEnd', () => {
    const result = range(3, 7, true)
    expect(result.begin).toEqual(3)
    expect(result.end).toEqual(7)
    expect(result.excludeEnd).toBe(true)
  })

  context('when both begin and end are null', () => {
    it('throws', () => {
      expect(() => range(null, null)).toThrow('Must pass either begin or end to a range')
    })
  })

  context('when begin is 0', () => {
    it('does not throw and treats 0 as a valid open-ended lower bound', () => {
      const result = range(0)
      expect(result.begin).toEqual(0)
      expect(result.end).toBeNull()
    })
  })

  context('when begin is 0n (bigint)', () => {
    it('does not throw and treats 0n as a valid lower bound', () => {
      const result = range(0n)
      expect(result.begin).toEqual(0n)
    })
  })

  context('when end is 0 and begin is null', () => {
    it('does not throw and treats 0 as a valid upper bound', () => {
      const result = range(null, 0)
      expect(result.end).toEqual(0)
    })
  })

  it('supports DateTime and CalendarDate bounds', () => {
    const begin = DateTime.fromISO('2026-01-01T00:00:00Z')
    const end = CalendarDate.fromISO('2026-01-02')
    const result: Range<DateTime | CalendarDate> = range(begin, end)

    expect(result.begin).toEqual(begin)
    expect(result.end).toEqual(end)
  })

  it('supports ClockTime bounds', () => {
    const begin = ClockTime.fromISO('10:00:00')
    const end = ClockTime.fromISO('12:00:00')
    const result: Range<ClockTime> = range(begin, end)
    const openEndedResult: Range<null, ClockTime> = range(null, end)

    expect(result.begin).toEqual(begin)
    expect(result.end).toEqual(end)
    expect(openEndedResult.begin).toBeNull()
    expect(openEndedResult.end).toEqual(end)
  })

  it('supports ClockTimeTz bounds', () => {
    const begin = ClockTimeTz.fromISO('10:00:00Z')
    const end = ClockTimeTz.fromISO('12:00:00Z')
    const result: Range<ClockTimeTz> = range(begin, end)
    const openEndedResult: Range<null, ClockTimeTz> = range(null, end)

    expect(result.begin).toEqual(begin)
    expect(result.end).toEqual(end)
    expect(openEndedResult.begin).toBeNull()
    expect(openEndedResult.end).toEqual(end)
  })
})
