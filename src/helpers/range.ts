import CalendarDate from './CalendarDate.js'
import { DateTime } from './DateTime.js'

export default function range<
  T,
  U extends T extends null ? any : T extends DateTime | CalendarDate ? DateTime | CalendarDate : T,
>(begin: T, end: U | null = null, excludeEnd: boolean = false) {
  return new Range<T, U>(begin, end, excludeEnd)
}

export class Range<
  T,
  U extends T extends null
    ? any
    : T extends DateTime | CalendarDate
      ? DateTime | CalendarDate
      : T = T extends null ? any : T extends DateTime | CalendarDate ? DateTime | CalendarDate : T,
> {
  constructor(
    public readonly begin: T | null,
    public readonly end: U | null = null,
    public readonly excludeEnd: boolean = false
  ) {
    if (!begin && !end) throw new Error('Must pass either begin or end to a range')
  }
}
