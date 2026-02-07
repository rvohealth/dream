import type { DateTimeUnit, DurationLikeObject } from './datetime.js'

export type CalendarDateDurationLike = Pick<
  DurationLikeObject,
  'year' | 'years' | 'quarter' | 'quarters' | 'month' | 'months' | 'week' | 'weeks' | 'day' | 'days'
>
export type CalendarDateDurationUnit = 'years' | 'weeks' | 'days'
export type CalendarDateUnit = Extract<DateTimeUnit, 'year' | 'quarter' | 'month' | 'week' | 'day'>
