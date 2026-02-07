import { DateTimeObject, DateTimeUnit, DurationLikeObject, DurationObject, DurationUnit } from './datetime.js'

/**
 * Time-only object for ClockTime (hour, minute, second, millisecond, microsecond).
 */
export type ClockTimeObject = Pick<
  DateTimeObject,
  'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond'
>

/**
 * Time-only duration units for ClockTime.
 */
export type ClockTimeDurationUnit = Extract<
  DurationUnit,
  'hours' | 'minutes' | 'seconds' | 'milliseconds' | 'microseconds'
>
export type ClockTimeUnit = Extract<
  DateTimeUnit,
  'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond'
>

/**
 * Complete duration object with all possible clock time units.
 */
export type ClockTimeDurationObject = Pick<
  DurationObject,
  'hours' | 'minutes' | 'seconds' | 'milliseconds' | 'microseconds'
>

/**
 * Helper type to extract only the units specified in the unit parameter for ClockTime.diff().
 * If unit is a single string, returns an object with just that key.
 * If unit is an array, returns an object with keys for each unit in the array.
 * If unit is undefined, returns the full ClockTimeDurationObject.
 */
export type ClockTimeDiffResult<
  U extends ClockTimeDurationUnit | readonly ClockTimeDurationUnit[] | undefined,
> = U extends undefined
  ? ClockTimeDurationObject
  : U extends ClockTimeDurationUnit
    ? Pick<Required<ClockTimeDurationObject>, U>
    : U extends readonly ClockTimeDurationUnit[]
      ? Pick<Required<ClockTimeDurationObject>, U[number]>
      : never

export type ClockTimeDurationLikeObject = Pick<
  DurationLikeObject,
  | 'hour'
  | 'hours'
  | 'minute'
  | 'minutes'
  | 'second'
  | 'seconds'
  | 'millisecond'
  | 'milliseconds'
  | 'microsecond'
  | 'microseconds'
>
