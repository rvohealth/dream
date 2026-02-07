// Export our own interfaces to avoid depending on Luxon types

export interface DateTimeOptions {
  zone?: string | Zone
  locale?: string
}

export interface DateTimeJSOptions {
  zone?: string | Zone | undefined
  locale?: string | undefined
  outputCalendar?: string | undefined
  numberingSystem?: string | undefined
}

export interface LocaleOptions {
  locale?: string
  outputCalendar?: string
  numberingSystem?: string
}

export interface DateTimeObject {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  millisecond: number
  microsecond: number
}

export interface ToISOTimeOptions {
  suppressMilliseconds?: boolean
  suppressSeconds?: boolean
  includeOffset?: boolean
  includePrefix?: boolean
  format?: 'basic' | 'extended'
  truncateMicroseconds?: boolean
}

export interface ToSQLOptions {
  includeZone?: boolean
  includeOffset?: boolean
  includeOffsetSpace?: boolean
  truncateMicroseconds?: boolean
}

export type DateTimeUnit =
  | 'year'
  | 'quarter'
  | 'month'
  | 'week'
  | 'day'
  | 'hour'
  | 'minute'
  | 'second'
  | 'millisecond'

/**
 * Weekday name type (lowercase).
 */
export type WeekdayName = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

/**
 * Represents a timezone. This is a simplified interface compatible with Luxon's Zone.
 * Users can pass timezone strings (e.g., "America/New_York", "UTC") or Zone instances.
 */
export interface Zone {
  /**
   * The type of zone (e.g., "iana", "fixed", "system", "invalid")
   */
  readonly type: string

  /**
   * The name of this zone
   */
  readonly name: string

  /**
   * Returns whether the offset is known to be fixed for the whole year
   */
  readonly isUniversal: boolean

  /**
   * Return the offset in minutes for this zone at the specified timestamp
   * @param ts - Epoch milliseconds for which to compute the offset
   */
  offset(ts: number): number

  /**
   * Returns the offset's common name (such as EST) at the specified timestamp
   * @param ts - Epoch milliseconds for which to get the name
   * @param options - Options to affect the format
   */
  offsetName(ts: number, options: { format?: 'short' | 'long'; locale?: string }): string | null

  /**
   * Returns the offset's value as a string
   * @param ts - Epoch milliseconds for which to get the offset
   * @param format - What style of offset to return ('narrow', 'short', or 'techie')
   */
  formatOffset(ts: number, format: string): string

  /**
   * Return whether this Zone is equal to another zone
   * @param other - the zone to compare
   */
  equals(other: Zone): boolean

  /**
   * Return whether this Zone is valid
   */
  readonly isValid: boolean
}

/**
 * Duration units that can be used in diff operations.
 */
export type DurationUnit =
  | 'years'
  | 'quarters'
  | 'months'
  | 'weeks'
  | 'days'
  | 'hours'
  | 'minutes'
  | 'seconds'
  | 'milliseconds'
  | 'microseconds'

/**
 * Complete duration object with all possible units returned by diff.
 */
export interface DurationObject {
  years?: number
  quarters?: number
  months?: number
  weeks?: number
  days?: number
  hours?: number
  minutes?: number
  seconds?: number
  milliseconds?: number
  microseconds?: number
}

/**
 * Helper type to extract only the units specified in the unit parameter.
 * If unit is a single string, returns an object with just that key.
 * If unit is an array, returns an object with keys for each unit in the array.
 * If unit is undefined, returns the full DurationObject.
 */
export type DiffResult<U extends DurationUnit | readonly DurationUnit[] | undefined> = U extends undefined
  ? DurationObject
  : U extends DurationUnit
    ? Pick<Required<DurationObject>, U>
    : U extends readonly DurationUnit[]
      ? Pick<Required<DurationObject>, U[number]>
      : never

export interface DurationLikeObject {
  year?: number
  years?: number
  quarter?: number
  quarters?: number
  month?: number
  months?: number
  week?: number
  weeks?: number
  day?: number
  days?: number
  hour?: number
  hours?: number
  minute?: number
  minutes?: number
  second?: number
  seconds?: number
  millisecond?: number
  milliseconds?: number
  microsecond?: number
  microseconds?: number
}
