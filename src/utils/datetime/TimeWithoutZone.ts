import {
  type DateTimeJSOptions,
  type DateTimeObject,
  type DateTimeOptions,
  type DateTimeUnit,
  type DurationLikeObject,
  type DurationUnit,
  type LocaleOptions,
  type ToISOTimeOptions,
  type ToSQLOptions,
} from '../../types/datetime.js'
import { DateTime } from './DateTime.js'

/**
 * TimeWithoutZone represents a time without timezone information.
 * Useful for representing time without zone fields from a Postgres database (TIME type).
 * Always stored in UTC internally but zone-agnostic for display purposes.
 */
export default class TimeWithoutZone {
  protected readonly dateTime: DateTime

  /**
   * Creates a TimeWithoutZone from a DateTime, time components, or defaults to now.
   * @param source - DateTime instance, hour number, or null/undefined for now
   * @param minute - Minute (0-59) when source is an hour number
   * @param second - Second (0-59) when source is an hour number
   * @param millisecond - Millisecond (0-999) when source is an hour number
   * @param microsecond - Microsecond (0-999) when source is an hour number
   * @example
   * ```ts
   * new TimeWithoutZone()                              // now
   * new TimeWithoutZone(DateTime.now())                // from DateTime
   * new TimeWithoutZone(14, 30, 45, 123, 456)         // 14:30:45.123456
   * ```
   */
  constructor(
    source?: DateTime | number | null,
    minute: number = 0,
    second: number = 0,
    millisecond: number = 0,
    microsecond: number = 0
  ) {
    if (source instanceof DateTime && source.isValid) {
      // Extract time components and store in UTC (zone-agnostic)
      this.dateTime = DateTime.utc(
        1970,
        1,
        1,
        source.hour,
        source.minute,
        source.second,
        source.millisecond,
        source.microsecond
      )
    } else if (typeof source === 'number') {
      try {
        // Create a DateTime with epoch date and the specified time in UTC
        this.dateTime = DateTime.utc(1970, 1, 1, source, minute, second, millisecond, microsecond)
      } catch (error) {
        if (error instanceof Error) throw new InvalidTimeWithoutZone(error)
        throw error
      }
    } else {
      const now = DateTime.now()
      this.dateTime = DateTime.utc(
        1970,
        1,
        1,
        now.hour,
        now.minute,
        now.second,
        now.millisecond,
        now.microsecond
      )
    }
  }

  /**
   * Create a TimeWithoutZone from a DateTime instance.
   * @param dateTime - A DateTime instance
   * @returns A TimeWithoutZone for the time portion of the DateTime
   * @example
   * ```ts
   * TimeWithoutZone.fromDateTime(DateTime.now())
   * ```
   */
  public static fromDateTime(dateTime: DateTime): TimeWithoutZone {
    return new TimeWithoutZone(dateTime)
  }

  /**
   * Create a TimeWithoutZone from a JavaScript Date.
   * @param javascriptDate - A JavaScript Date instance
   * @returns A TimeWithoutZone for the time portion
   * @example
   * ```ts
   * TimeWithoutZone.fromJSDate(new Date())
   * ```
   */
  public static fromJSDate(javascriptDate: Date): TimeWithoutZone {
    return new TimeWithoutZone(DateTime.fromJSDate(javascriptDate))
  }

  /**
   * Create a TimeWithoutZone from an ISO 8601 time string.
   * @param str - ISO time string (e.g., '14:30:45.123456')
   * @returns A TimeWithoutZone for the given time
   * @throws {InvalidTimeWithoutZone} When the ISO string is invalid
   * @example
   * ```ts
   * TimeWithoutZone.fromISO('14:30:45.123456')
   * TimeWithoutZone.fromISO('2024-03-02T14:30:45Z')  // extracts time only
   * ```
   */
  public static fromISO(str: string): TimeWithoutZone {
    let dateTime: DateTime

    try {
      dateTime = DateTime.fromISO(str, { setZone: true })
    } catch (error) {
      if (error instanceof Error) throw new InvalidTimeWithoutZone(error)
      throw error
    }

    return new TimeWithoutZone(dateTime)
  }

  /**
   * Create a TimeWithoutZone from an SQL time string.
   * @param str - SQL time string (e.g., '14:30:45.123456')
   * @returns A TimeWithoutZone for the given time
   * @throws {InvalidTimeWithoutZone} When the SQL string is invalid
   * @example
   * ```ts
   * TimeWithoutZone.fromSQL('14:30:45.123456')
   * TimeWithoutZone.fromSQL('2024-03-02 14:30:45.123456')  // extracts time only
   * ```
   */
  public static fromSQL(str: string): TimeWithoutZone {
    let dateTime: DateTime

    try {
      dateTime = DateTime.fromSQL(str)
    } catch (error) {
      if (error instanceof Error) throw new InvalidTimeWithoutZone(error)
      throw error
    }

    return new TimeWithoutZone(dateTime)
  }

  /**
   * Create a TimeWithoutZone from a custom format string.
   * Uses Luxon format tokens (e.g., 'HH:mm:ss', 'hh:mm a').
   * @param text - The string to parse
   * @param format - Format string using Luxon tokens
   * @param options - Optional locale options
   * @returns A TimeWithoutZone for the parsed time
   * @throws {InvalidTimeWithoutZone} When the string doesn't match the format or is invalid
   * @example
   * ```ts
   * TimeWithoutZone.fromFormat('14:30:45', 'HH:mm:ss')
   * TimeWithoutZone.fromFormat('2:30 PM', 'h:mm a')
   * ```
   */
  public static fromFormat(text: string, format: string, opts?: DateTimeOptions): TimeWithoutZone {
    let dateTime: DateTime

    try {
      dateTime = DateTime.fromFormat(text, format, opts)
    } catch (error) {
      if (error instanceof Error) throw new InvalidTimeWithoutZone(error)
      throw error
    }

    return new TimeWithoutZone(dateTime)
  }

  /**
   * Create a TimeWithoutZone from an object with time units.
   * @param obj - Object with hour, minute, second, millisecond, microsecond properties
   * @param opts - Optional locale options
   * @returns A TimeWithoutZone for the given components
   * @throws {InvalidTimeWithoutZone} When time values are invalid
   * @example
   * ```ts
   * TimeWithoutZone.fromObject({ hour: 14, minute: 30, second: 45 })
   * ```
   */
  public static fromObject(obj: DateTimeObject, opts?: DateTimeJSOptions): TimeWithoutZone {
    let dateTime: DateTime

    try {
      // Use epoch date (1970-01-01) with the specified time
      const fullObj = {
        year: 1970,
        month: 1,
        day: 1,
        ...obj,
      }
      dateTime = DateTime.fromObject(fullObj, { ...opts, zone: 'UTC' })
    } catch (error) {
      if (error instanceof Error) throw new InvalidTimeWithoutZone(error)
      throw error
    }

    return new TimeWithoutZone(dateTime)
  }

  /**
   * Returns a TimeWithoutZone for the current time.
   * @returns A TimeWithoutZone for now
   * @example
   * ```ts
   * TimeWithoutZone.now()
   * ```
   */
  public static now(): TimeWithoutZone {
    return new TimeWithoutZone(DateTime.now())
  }

  /**
   * Returns the time as an ISO 8601 time string (without zone offset).
   * @param opts - Optional format options
   * @returns ISO time string (e.g., '14:30:45.123456')
   * @example
   * ```ts
   * TimeWithoutZone.fromObject({ hour: 14, minute: 30, second: 45 }).toISOTime()
   * ```
   */
  public toISOTime(opts?: ToISOTimeOptions): string {
    return this.dateTime.toISOTime({ ...opts, includeOffset: false })
  }

  /**
   * Returns the time as an SQL time string.
   * @param opts - Optional format options
   * @returns SQL time string (e.g., '14:30:45.123456')
   * @example
   * ```ts
   * TimeWithoutZone.fromObject({ hour: 14, minute: 30, second: 45 }).toSQLTime()
   * ```
   */
  public toSQLTime(opts?: ToSQLOptions): string {
    return this.dateTime.toSQLTime({ ...opts, includeZone: false, includeOffset: false })
  }

  /**
   * Returns the full ISO 8601 datetime string (with epoch date in UTC).
   * @returns ISO datetime string (e.g., '1970-01-01T14:30:45.123456Z')
   * @example
   * ```ts
   * TimeWithoutZone.fromObject({ hour: 14, minute: 30, second: 45 }).toISO()
   * ```
   */
  public toISO(): string {
    return this.dateTime.toISO()
  }

  /**
   * Returns the full SQL datetime string.
   * @param opts - Optional format options
   * @returns SQL datetime string (e.g., '1970-01-01 14:30:45.123456')
   * @example
   * ```ts
   * TimeWithoutZone.fromObject({ hour: 14, minute: 30, second: 45 }).toSQL()
   * ```
   */
  public toSQL(opts?: ToSQLOptions): string {
    return this.dateTime.toSQL(opts)
  }

  /**
   * Returns the time as an ISO time string for JSON serialization.
   * @returns ISO time string
   * @example
   * ```ts
   * JSON.stringify({ time: TimeWithoutZone.now() })
   * ```
   */
  public toJSON() {
    return this.toISOTime()
  }

  /**
   * Returns the time as an ISO time string (for valueOf() operations).
   * @returns ISO time string
   * @example
   * ```ts
   * TimeWithoutZone.now().valueOf()
   * ```
   */
  public valueOf(): string {
    return this.toISOTime()
  }

  /**
   * Returns a localized string representation of the time.
   * @param formatOpts - Intl.DateTimeFormat options for formatting
   * @param opts - Optional locale options
   * @returns Localized time string
   * @example
   * ```ts
   * TimeWithoutZone.now().toLocaleString()
   * TimeWithoutZone.now().toLocaleString({ hour: 'numeric', minute: '2-digit' })
   * ```
   */
  public toLocaleString(formatOpts?: Intl.DateTimeFormatOptions, opts?: LocaleOptions): string {
    return this.dateTime.toLocaleString(formatOpts, opts)
  }

  /**
   * Returns the time as an ISO time string (same as toISOTime).
   * @returns ISO time string
   * @example
   * ```ts
   * String(TimeWithoutZone.now())
   * ```
   */
  public toString() {
    return this.toISOTime()
  }

  /**
   * Returns the underlying DateTime instance.
   * @returns A DateTime representing this time (with epoch date in UTC)
   * @example
   * ```ts
   * const dt = TimeWithoutZone.now().toDateTime()
   * ```
   */
  public toDateTime(): DateTime {
    return this.dateTime
  }

  /**
   * Returns a JavaScript Date for this time.
   * @returns A JavaScript Date instance
   * @example
   * ```ts
   * const jsDate = TimeWithoutZone.now().toJSDate()
   * ```
   */
  public toJSDate(): Date {
    return this.dateTime.toJSDate()
  }

  /**
   * Gets the hour (0-23).
   * @returns The hour number
   * @example
   * ```ts
   * TimeWithoutZone.fromObject({ hour: 14, minute: 30 }).hour  // 14
   * ```
   */
  public get hour(): number {
    return this.dateTime.hour
  }

  /**
   * Gets the minute (0-59).
   * @returns The minute number
   * @example
   * ```ts
   * TimeWithoutZone.fromObject({ hour: 14, minute: 30 }).minute  // 30
   * ```
   */
  public get minute(): number {
    return this.dateTime.minute
  }

  /**
   * Gets the second (0-59).
   * @returns The second number
   * @example
   * ```ts
   * TimeWithoutZone.fromObject({ hour: 14, minute: 30, second: 45 }).second  // 45
   * ```
   */
  public get second(): number {
    return this.dateTime.second
  }

  /**
   * Gets the millisecond (0-999).
   * @returns The millisecond number
   * @example
   * ```ts
   * TimeWithoutZone.fromObject({ hour: 14, minute: 30, millisecond: 123 }).millisecond  // 123
   * ```
   */
  public get millisecond(): number {
    return this.dateTime.millisecond
  }

  /**
   * Gets the microsecond (0-999).
   * @returns The microsecond number
   * @example
   * ```ts
   * TimeWithoutZone.fromISO('14:30:45.123456').microsecond  // 456
   * ```
   */
  public get microsecond(): number {
    return this.dateTime.microsecond
  }

  /**
   * Returns a new TimeWithoutZone at the start of the given period.
   * @param period - Unit to truncate to ('hour', 'minute', or 'second')
   * @returns A TimeWithoutZone at the start of the period
   * @example
   * ```ts
   * TimeWithoutZone.fromObject({ hour: 14, minute: 30, second: 45 }).startOf('hour')
   * // hour: 14, minute: 0, second: 0
   * ```
   */
  public startOf(period: DateTimeUnit): TimeWithoutZone {
    return new TimeWithoutZone(this.dateTime.startOf(period))
  }

  /**
   * Returns a new TimeWithoutZone at the end of the given period.
   * @param period - Unit to extend to end of ('hour', 'minute', or 'second')
   * @returns A TimeWithoutZone at the end of the period
   * @example
   * ```ts
   * TimeWithoutZone.fromObject({ hour: 14, minute: 30 }).endOf('hour')
   * // hour: 14, minute: 59, second: 59, millisecond: 999
   * ```
   */
  public endOf(period: DateTimeUnit): TimeWithoutZone {
    return new TimeWithoutZone(this.dateTime.endOf(period))
  }

  /**
   * Returns a new TimeWithoutZone with the given duration added.
   * @param duration - Duration to add (object with hours, minutes, seconds, etc.)
   * @returns A new TimeWithoutZone
   * @example
   * ```ts
   * TimeWithoutZone.fromObject({ hour: 14, minute: 30 }).plus({ hours: 2, minutes: 15 })
   * // hour: 16, minute: 45
   * ```
   */
  public plus(duration: DurationLikeObject): TimeWithoutZone {
    return new TimeWithoutZone(this.dateTime.plus(duration))
  }

  /**
   * Returns a new TimeWithoutZone with the given duration subtracted.
   * @param duration - Duration to subtract (object with hours, minutes, seconds, etc.)
   * @returns A new TimeWithoutZone
   * @example
   * ```ts
   * TimeWithoutZone.fromObject({ hour: 14, minute: 30 }).minus({ hours: 2, minutes: 15 })
   * // hour: 12, minute: 15
   * ```
   */
  public minus(duration: DurationLikeObject): TimeWithoutZone {
    return new TimeWithoutZone(this.dateTime.minus(duration))
  }

  /**
   * Returns the earliest TimeWithoutZone from the given arguments.
   * @param timeWithoutZones - TimeWithoutZones to compare
   * @returns The earliest TimeWithoutZone
   * @example
   * ```ts
   * TimeWithoutZone.min(time1, time2, time3)
   * ```
   */
  public static min(...timeWithoutZones: Array<TimeWithoutZone>): TimeWithoutZone | null {
    if (timeWithoutZones.length === 0) return null
    return timeWithoutZones.reduce(
      (best, time) => (time.valueOf() < best.valueOf() ? time : best),
      timeWithoutZones[0]!
    )
  }

  /**
   * Returns the latest TimeWithoutZone from the given arguments.
   * @param timeWithoutZones - TimeWithoutZones to compare
   * @returns The latest TimeWithoutZone
   * @example
   * ```ts
   * TimeWithoutZone.max(time1, time2, time3)
   * ```
   */
  public static max(...timeWithoutZones: Array<TimeWithoutZone>): TimeWithoutZone | null {
    if (timeWithoutZones.length === 0) return null
    return timeWithoutZones.reduce(
      (best, time) => (time.valueOf() > best.valueOf() ? time : best),
      timeWithoutZones[0]!
    )
  }

  /**
   * Returns true if this and other are in the same unit of time.
   * @param otherTimeWithoutZone - TimeWithoutZone to compare against
   * @param period - Unit to check ('hour', 'minute', or 'second')
   * @returns true if same period
   * @example
   * ```ts
   * const t1 = TimeWithoutZone.fromObject({ hour: 14, minute: 30 })
   * const t2 = TimeWithoutZone.fromObject({ hour: 14, minute: 45 })
   * t1.hasSame(t2, 'hour')    // true
   * t1.hasSame(t2, 'minute')  // false
   * ```
   */
  public hasSame(otherTimeWithoutZone: TimeWithoutZone, period: DateTimeUnit): boolean {
    const otherDateTime = otherTimeWithoutZone.toDateTime()
    if (otherDateTime === null) return false
    return this.dateTime.hasSame(otherDateTime, period)
  }

  /**
   * Returns the difference between this TimeWithoutZone and another in the specified unit.
   * @param otherTimeWithoutZone - TimeWithoutZone to compare against
   * @param duration - Unit for the difference ('hours', 'minutes', 'seconds', etc.)
   * @returns Numeric difference in the specified unit
   * @example
   * ```ts
   * const t1 = TimeWithoutZone.fromObject({ hour: 14, minute: 30 })
   * const t2 = TimeWithoutZone.fromObject({ hour: 10, minute: 15 })
   * t1.diff(t2, 'hours')    // 4.25
   * t1.diff(t2, 'minutes')  // 255
   * ```
   */
  public diff(otherTimeWithoutZone: TimeWithoutZone, duration: DurationUnit): number {
    const otherDateTime = otherTimeWithoutZone.toDateTime()
    const result = this.dateTime.diff(otherDateTime, duration) as Record<string, number>
    return result[duration] ?? 0
  }

  /**
   * Returns the difference between this TimeWithoutZone and now in the specified unit.
   * @param duration - Unit for the difference ('hours', 'minutes', 'seconds', etc.)
   * @returns Numeric difference in the specified unit
   * @example
   * ```ts
   * const future = TimeWithoutZone.now().plus({ hours: 2 })
   * future.diffNow('hours')  // approximately 2
   * ```
   */
  public diffNow(duration: DurationUnit): number {
    const now = TimeWithoutZone.now()
    return this.diff(now, duration)
  }

  /**
   * Returns true if this TimeWithoutZone equals another TimeWithoutZone.
   * @param otherTimeWithoutZone - TimeWithoutZone to compare
   * @returns true if times are equal
   * @example
   * ```ts
   * const t1 = TimeWithoutZone.fromObject({ hour: 14, minute: 30 })
   * const t2 = TimeWithoutZone.fromObject({ hour: 14, minute: 30 })
   * t1.equals(t2)  // true
   * ```
   */
  public equals(otherTimeWithoutZone: TimeWithoutZone): boolean {
    return this.dateTime.equals(otherTimeWithoutZone.toDateTime())
  }
}

/**
 * Thrown when a TimeWithoutZone is invalid (e.g., invalid input or time values).
 * @param error - The original error (available as cause)
 * @example
 * ```ts
 * try {
 *   TimeWithoutZone.fromISO('25:00:00')
 * } catch (e) {
 *   if (e instanceof InvalidTimeWithoutZone) console.error(e.message)
 * }
 * ```
 */
export class InvalidTimeWithoutZone extends Error {
  constructor(error: Error) {
    super((error.message ?? '').replace('DateTime', 'TimeWithoutZone'))
  }
}
