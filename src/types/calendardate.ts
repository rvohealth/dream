import type { DateTimeObject, DateTimeUnit, DurationLikeObject } from './datetime.js'

export type CalendarDateDurationLike = Pick<
  DurationLikeObject,
  'year' | 'years' | 'quarter' | 'quarters' | 'month' | 'months' | 'week' | 'weeks' | 'day' | 'days'
>
export type CalendarDateDurationUnit = 'years' | 'quarters' | 'months' | 'weeks' | 'days'
export type CalendarDateUnit = Extract<DateTimeUnit, 'year' | 'quarter' | 'month' | 'week' | 'day'>

/**
 * Date-only object for CalendarDate (year, month, day).
 */
export type CalendarDateObject = Pick<DateTimeObject, 'year' | 'month' | 'day'>

/**
 * Complete duration object with all possible calendar date units.
 */
export interface CalendarDateDurationObject {
  years?: number
  quarters?: number
  months?: number
  weeks?: number
  days?: number
}

/**
 * Helper type to extract only the units specified in the unit parameter for CalendarDate.diff().
 * If unit is a single string, returns an object with just that key.
 * If unit is an array, returns an object with keys for each unit in the array.
 * If unit is undefined, returns the full CalendarDateDurationObject.
 */
export type CalendarDateDiffResult<
  U extends CalendarDateDurationUnit | readonly CalendarDateDurationUnit[] | undefined,
> = U extends undefined
  ? CalendarDateDurationObject
  : U extends CalendarDateDurationUnit
    ? Pick<Required<CalendarDateDurationObject>, U>
    : U extends readonly CalendarDateDurationUnit[]
      ? Pick<Required<CalendarDateDurationObject>, U[number]>
      : never
