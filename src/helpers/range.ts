import type CalendarDate from '../utils/datetime/CalendarDate.js'
import type ClockTime from '../utils/datetime/ClockTime.js'
import type ClockTimeTz from '../utils/datetime/ClockTimeTz.js'
import type { DateTime } from '../utils/datetime/DateTime.js'

type RangeEndType<T> = T extends null
  ? any
  : T extends DateTime | CalendarDate
    ? DateTime | CalendarDate
    : T extends ClockTime
      ? ClockTime
      : T extends ClockTimeTz
        ? ClockTimeTz
        : T

export default function range<T, U extends RangeEndType<T>>(
  begin: T,
  end: U | null = null,
  excludeEnd: boolean = false
) {
  return new Range<T, U>(begin, end, excludeEnd)
}

export class Range<T, U extends RangeEndType<T> = RangeEndType<T>> {
  constructor(
    public readonly begin: T | null,
    public readonly end: U | null = null,
    public readonly excludeEnd: boolean = false
  ) {
    if (begin == null && end == null) throw new Error('Must pass either begin or end to a range')
  }
}
