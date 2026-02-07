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
  type Zone,
} from '../../types/datetime.js'
import { DateTime } from './DateTime.js'

/**
 * TimeWithZone represents a time with timezone information.
 * Useful for representing time with zone fields from a Postgres database.
 */
export default class TimeWithZone {
  protected readonly dateTime: DateTime

  /**
   * Creates a TimeWithZone from a DateTime, time components, or defaults to now.
   * @param source - DateTime instance, hour number, or null/undefined for now
   * @param minute - Minute (0-59) when source is an hour number
   * @param second - Second (0-59) when source is an hour number
   * @param millisecond - Millisecond (0-999) when source is an hour number
   * @param microsecond - Microsecond (0-999) when source is an hour number
   * @param zone - Timezone when source is an hour number
   * @example
   * ```ts
   * new TimeWithZone()                                     // now
   * new TimeWithZone(DateTime.now())                       // from DateTime
   * new TimeWithZone(14, 30, 45, 123, 456, 'UTC')         // 14:30:45.123456 UTC
   * ```
   */
  constructor(
    source?: DateTime | number | null,
    minute: number = 0,
    second: number = 0,
    millisecond: number = 0,
    microsecond: number = 0,
    zone: string | Zone = 'UTC'
  ) {
    if (source instanceof DateTime && source.isValid) {
      this.dateTime = source
    } else if (typeof source === 'number') {
      try {
        // Create a DateTime with today's date and the specified time
        const now = DateTime.now().setZone(zone)
        this.dateTime = DateTime.fromObject(
          {
            year: now.year,
            month: now.month,
            day: now.day,
            hour: source,
            minute,
            second,
            millisecond,
            microsecond,
          },
          { zone }
        )
      } catch (error) {
        if (error instanceof Error) throw new InvalidTimeWithZone(error)
        throw error
      }
    } else {
      this.dateTime = TimeWithZone.now().toDateTime()
    }
  }

  /**
   * Create a TimeWithZone from a DateTime instance.
   * @param dateTime - A DateTime instance
   * @returns A TimeWithZone for the time portion of the DateTime
   * @example
   * ```ts
   * TimeWithZone.fromDateTime(DateTime.now())
   * ```
   */
  public static fromDateTime(dateTime: DateTime): TimeWithZone {
    return new TimeWithZone(dateTime)
  }

  /**
   * Create a TimeWithZone from a JavaScript Date.
   * @param javascriptDate - A JavaScript Date instance
   * @param options - Optional zone to interpret the time in
   * @returns A TimeWithZone for the time portion
   * @example
   * ```ts
   * TimeWithZone.fromJSDate(new Date())
   * TimeWithZone.fromJSDate(new Date(), { zone: 'America/New_York' })
   * ```
   */
  public static fromJSDate(javascriptDate: Date, { zone }: { zone?: string | Zone } = {}): TimeWithZone {
    return new TimeWithZone(DateTime.fromJSDate(javascriptDate, zone ? { zone } : {}))
  }

  /**
   * Create a TimeWithZone from an ISO 8601 time string.
   * @param str - ISO time string (e.g., '14:30:45.123456-05:00')
   * @param options - Optional zone to interpret the time in
   * @returns A TimeWithZone for the given time
   * @throws {InvalidTimeWithZone} When the ISO string is invalid
   * @example
   * ```ts
   * TimeWithZone.fromISO('14:30:45.123456-05:00')
   * TimeWithZone.fromISO('2024-03-02T14:30:45Z')
   * ```
   */
  public static fromISO(str: string, { zone }: { zone?: string | Zone } = {}): TimeWithZone {
    let dateTime: DateTime

    try {
      dateTime = DateTime.fromISO(str, zone ? { zone } : { setZone: true })
    } catch (error) {
      if (error instanceof Error) throw new InvalidTimeWithZone(error)
      throw error
    }

    return new TimeWithZone(dateTime)
  }

  /**
   * Create a TimeWithZone from an SQL time string.
   * @param str - SQL time string (e.g., '14:30:45.123456')
   * @param options - Optional zone to interpret the time in
   * @returns A TimeWithZone for the given time
   * @throws {InvalidTimeWithZone} When the SQL string is invalid
   * @example
   * ```ts
   * TimeWithZone.fromSQL('14:30:45.123456')
   * TimeWithZone.fromSQL('2024-03-02 14:30:45.123456')
   * ```
   */
  public static fromSQL(str: string, { zone }: { zone?: string | Zone } = {}): TimeWithZone {
    let dateTime: DateTime

    try {
      dateTime = DateTime.fromSQL(str, zone ? { zone } : {})
    } catch (error) {
      if (error instanceof Error) throw new InvalidTimeWithZone(error)
      throw error
    }

    return new TimeWithZone(dateTime)
  }

  /**
   * Create a TimeWithZone from a custom format string.
   * Uses Luxon format tokens (e.g., 'HH:mm:ss', 'hh:mm a').
   * @param text - The string to parse
   * @param format - Format string using Luxon tokens
   * @param options - Optional zone and locale options
   * @returns A TimeWithZone for the parsed time
   * @throws {InvalidTimeWithZone} When the string doesn't match the format or is invalid
   * @example
   * ```ts
   * TimeWithZone.fromFormat('14:30:45', 'HH:mm:ss')
   * TimeWithZone.fromFormat('2:30 PM', 'h:mm a')
   * TimeWithZone.fromFormat('14:30:45 -05:00', 'HH:mm:ss ZZ')
   * ```
   */
  public static fromFormat(text: string, format: string, opts?: DateTimeOptions): TimeWithZone {
    let dateTime: DateTime

    try {
      dateTime = DateTime.fromFormat(text, format, opts)
    } catch (error) {
      if (error instanceof Error) throw new InvalidTimeWithZone(error)
      throw error
    }

    return new TimeWithZone(dateTime)
  }

  /**
   * Create a TimeWithZone from an object with time units.
   * @param obj - Object with hour, minute, second, millisecond, microsecond properties
   * @param opts - Optional zone/locale options
   * @returns A TimeWithZone for the given components
   * @throws {InvalidTimeWithZone} When time values are invalid
   * @example
   * ```ts
   * TimeWithZone.fromObject({ hour: 14, minute: 30, second: 45 })
   * TimeWithZone.fromObject({ hour: 14, minute: 30 }, { zone: 'America/New_York' })
   * ```
   */
  public static fromObject(obj: DateTimeObject, opts?: DateTimeJSOptions): TimeWithZone {
    let dateTime: DateTime

    try {
      // If no date components are provided, use today's date
      const now = DateTime.now()
      const fullObj = {
        year: obj.year ?? now.year,
        month: obj.month ?? now.month,
        day: obj.day ?? now.day,
        ...obj,
      }
      dateTime = DateTime.fromObject(fullObj, opts)
    } catch (error) {
      if (error instanceof Error) throw new InvalidTimeWithZone(error)
      throw error
    }

    return new TimeWithZone(dateTime)
  }

  /**
   * Returns a TimeWithZone for the current time.
   * @param options - Optional zone (defaults to system timezone)
   * @returns A TimeWithZone for now
   * @example
   * ```ts
   * TimeWithZone.now()
   * TimeWithZone.now({ zone: 'America/New_York' })
   * ```
   */
  public static now({ zone }: { zone?: string | Zone } = {}): TimeWithZone {
    return new TimeWithZone(zone ? DateTime.now().setZone(zone) : DateTime.now())
  }

  /**
   * Returns the time as an ISO 8601 time string.
   * @param opts - Optional format options
   * @returns ISO time string (e.g., '14:30:45.123456-05:00')
   * @example
   * ```ts
   * TimeWithZone.fromObject({ hour: 14, minute: 30, second: 45 }).toISOTime()
   * ```
   */
  public toISOTime(opts?: ToISOTimeOptions): string {
    return this.dateTime.toISOTime(opts)
  }

  /**
   * Returns the time as an SQL time string.
   * @param opts - Optional format options
   * @returns SQL time string (e.g., '14:30:45.123456')
   * @example
   * ```ts
   * TimeWithZone.fromObject({ hour: 14, minute: 30, second: 45 }).toSQLTime()
   * ```
   */
  public toSQLTime(opts?: ToSQLOptions): string {
    return this.dateTime.toSQLTime(opts)
  }

  /**
   * Returns the full ISO 8601 datetime string.
   * @returns ISO datetime string (e.g., '2024-03-02T14:30:45.123456-05:00')
   * @example
   * ```ts
   * TimeWithZone.fromObject({ hour: 14, minute: 30, second: 45 }).toISO()
   * ```
   */
  public toISO(): string {
    return this.dateTime.toISO()
  }

  /**
   * Returns the full SQL datetime string.
   * @param opts - Optional format options
   * @returns SQL datetime string (e.g., '2024-03-02 14:30:45.123456')
   * @example
   * ```ts
   * TimeWithZone.fromObject({ hour: 14, minute: 30, second: 45 }).toSQL()
   * ```
   */
  public toSQL(opts?: ToSQLOptions): string {
    return this.dateTime.toSQL(opts)
  }

  /**
   * Returns the time as an ISO string for JSON serialization.
   * @returns ISO datetime string
   * @example
   * ```ts
   * JSON.stringify({ time: TimeWithZone.now() })
   * ```
   */
  public toJSON() {
    return this.toISO()
  }

  /**
   * Returns the time as an ISO string (for valueOf() operations).
   * @returns ISO datetime string
   * @example
   * ```ts
   * TimeWithZone.now().valueOf()
   * ```
   */
  public valueOf(): string {
    return this.toISO()
  }

  /**
   * Returns a localized string representation of the time.
   * @param formatOpts - Intl.DateTimeFormat options for formatting
   * @param opts - Optional locale options
   * @returns Localized time string
   * @example
   * ```ts
   * TimeWithZone.now().toLocaleString()
   * TimeWithZone.now().toLocaleString({ hour: 'numeric', minute: '2-digit' })
   * ```
   */
  public toLocaleString(formatOpts?: Intl.DateTimeFormatOptions, opts?: LocaleOptions): string {
    return this.dateTime.toLocaleString(formatOpts, opts)
  }

  /**
   * Returns the time as an ISO string (same as toISO).
   * @returns ISO datetime string
   * @example
   * ```ts
   * String(TimeWithZone.now())
   * ```
   */
  public toString() {
    return this.toISO()
  }

  /**
   * Returns the underlying DateTime instance.
   * @returns A DateTime representing this time with zone
   * @example
   * ```ts
   * const dt = TimeWithZone.now().toDateTime()
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
   * const jsDate = TimeWithZone.now().toJSDate()
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
   * TimeWithZone.fromObject({ hour: 14, minute: 30 }).hour  // 14
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
   * TimeWithZone.fromObject({ hour: 14, minute: 30 }).minute  // 30
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
   * TimeWithZone.fromObject({ hour: 14, minute: 30, second: 45 }).second  // 45
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
   * TimeWithZone.fromObject({ hour: 14, minute: 30, millisecond: 123 }).millisecond  // 123
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
   * TimeWithZone.fromISO('14:30:45.123456').microsecond  // 456
   * ```
   */
  public get microsecond(): number {
    return this.dateTime.microsecond
  }

  /**
   * Gets the timezone name.
   * @returns The timezone name
   * @example
   * ```ts
   * TimeWithZone.fromObject({ hour: 14 }, { zone: 'America/New_York' }).zoneName
   * ```
   */
  public get zoneName(): string {
    return this.dateTime.zoneName
  }

  /**
   * Gets the timezone offset in minutes.
   * @returns The offset in minutes
   * @example
   * ```ts
   * TimeWithZone.fromISO('14:30:45-05:00').offset  // -300
   * ```
   */
  public get offset(): number {
    return this.dateTime.offset
  }

  /**
   * Returns a new TimeWithZone at the start of the given period.
   * @param period - Unit to truncate to ('hour', 'minute', or 'second')
   * @returns A TimeWithZone at the start of the period
   * @example
   * ```ts
   * TimeWithZone.fromObject({ hour: 14, minute: 30, second: 45 }).startOf('hour')
   * // hour: 14, minute: 0, second: 0
   * ```
   */
  public startOf(period: DateTimeUnit): TimeWithZone {
    return new TimeWithZone(this.dateTime.startOf(period))
  }

  /**
   * Returns a new TimeWithZone at the end of the given period.
   * @param period - Unit to extend to end of ('hour', 'minute', or 'second')
   * @returns A TimeWithZone at the end of the period
   * @example
   * ```ts
   * TimeWithZone.fromObject({ hour: 14, minute: 30 }).endOf('hour')
   * // hour: 14, minute: 59, second: 59, millisecond: 999
   * ```
   */
  public endOf(period: DateTimeUnit): TimeWithZone {
    return new TimeWithZone(this.dateTime.endOf(period))
  }

  /**
   * Returns a new TimeWithZone with the given duration added.
   * @param duration - Duration to add (object with hours, minutes, seconds, etc.)
   * @returns A new TimeWithZone
   * @example
   * ```ts
   * TimeWithZone.fromObject({ hour: 14, minute: 30 }).plus({ hours: 2, minutes: 15 })
   * // hour: 16, minute: 45
   * ```
   */
  public plus(duration: DurationLikeObject): TimeWithZone {
    return new TimeWithZone(this.dateTime.plus(duration))
  }

  /**
   * Returns a new TimeWithZone with the given duration subtracted.
   * @param duration - Duration to subtract (object with hours, minutes, seconds, etc.)
   * @returns A new TimeWithZone
   * @example
   * ```ts
   * TimeWithZone.fromObject({ hour: 14, minute: 30 }).minus({ hours: 2, minutes: 15 })
   * // hour: 12, minute: 15
   * ```
   */
  public minus(duration: DurationLikeObject): TimeWithZone {
    return new TimeWithZone(this.dateTime.minus(duration))
  }

  /**
   * Returns the earliest TimeWithZone from the given arguments.
   * @param timeWithZones - TimeWithZones to compare
   * @returns The earliest TimeWithZone
   * @example
   * ```ts
   * TimeWithZone.min(time1, time2, time3)
   * ```
   */
  public static min(...timeWithZones: Array<TimeWithZone>): TimeWithZone | null {
    if (timeWithZones.length === 0) return null
    return timeWithZones.reduce(
      (best, time) => (time.valueOf() < best.valueOf() ? time : best),
      timeWithZones[0]!
    )
  }

  /**
   * Returns the latest TimeWithZone from the given arguments.
   * @param timeWithZones - TimeWithZones to compare
   * @returns The latest TimeWithZone
   * @example
   * ```ts
   * TimeWithZone.max(time1, time2, time3)
   * ```
   */
  public static max(...timeWithZones: Array<TimeWithZone>): TimeWithZone | null {
    if (timeWithZones.length === 0) return null
    return timeWithZones.reduce(
      (best, time) => (time.valueOf() > best.valueOf() ? time : best),
      timeWithZones[0]!
    )
  }

  /**
   * Returns true if this and other are in the same unit of time.
   * @param otherTimeWithZone - TimeWithZone to compare against
   * @param period - Unit to check ('hour', 'minute', or 'second')
   * @returns true if same period
   * @example
   * ```ts
   * const t1 = TimeWithZone.fromObject({ hour: 14, minute: 30 })
   * const t2 = TimeWithZone.fromObject({ hour: 14, minute: 45 })
   * t1.hasSame(t2, 'hour')    // true
   * t1.hasSame(t2, 'minute')  // false
   * ```
   */
  public hasSame(otherTimeWithZone: TimeWithZone, period: DateTimeUnit): boolean {
    const otherDateTime = otherTimeWithZone.toDateTime()
    if (otherDateTime === null) return false
    return this.dateTime.hasSame(otherDateTime, period)
  }

  /**
   * Returns the difference between this TimeWithZone and another in the specified unit.
   * @param otherTimeWithZone - TimeWithZone to compare against
   * @param duration - Unit for the difference ('hours', 'minutes', 'seconds', etc.)
   * @returns Numeric difference in the specified unit
   * @example
   * ```ts
   * const t1 = TimeWithZone.fromObject({ hour: 14, minute: 30 })
   * const t2 = TimeWithZone.fromObject({ hour: 10, minute: 15 })
   * t1.diff(t2, 'hours')    // 4.25
   * t1.diff(t2, 'minutes')  // 255
   * ```
   */
  public diff(otherTimeWithZone: TimeWithZone, duration: DurationUnit): number {
    const otherDateTime = otherTimeWithZone.toDateTime()
    const result = this.dateTime.diff(otherDateTime, duration) as Record<string, number>
    return result[duration] ?? 0
  }

  /**
   * Returns the difference between this TimeWithZone and now in the specified unit.
   * @param duration - Unit for the difference ('hours', 'minutes', 'seconds', etc.)
   * @returns Numeric difference in the specified unit
   * @example
   * ```ts
   * const future = TimeWithZone.now().plus({ hours: 2 })
   * future.diffNow('hours')  // approximately 2
   * ```
   */
  public diffNow(duration: DurationUnit): number {
    const result = this.dateTime.diffNow(duration) as Record<string, number>
    return result[duration] ?? 0
  }

  /**
   * Returns true if this TimeWithZone equals another TimeWithZone.
   * @param otherTimeWithZone - TimeWithZone to compare
   * @returns true if times are equal
   * @example
   * ```ts
   * const t1 = TimeWithZone.fromObject({ hour: 14, minute: 30 })
   * const t2 = TimeWithZone.fromObject({ hour: 14, minute: 30 })
   * t1.equals(t2)  // true
   * ```
   */
  public equals(otherTimeWithZone: TimeWithZone): boolean {
    return this.dateTime.equals(otherTimeWithZone.toDateTime())
  }

  /**
   * Returns a new TimeWithZone with the timezone changed.
   * The time value changes to reflect the same instant in the new timezone.
   * @param zone - The timezone to convert to
   * @returns A new TimeWithZone in the specified timezone
   * @example
   * ```ts
   * const utc = TimeWithZone.fromObject({ hour: 14, minute: 30 }, { zone: 'UTC' })
   * const ny = utc.setZone('America/New_York')
   * // Time is converted to New York timezone (e.g., 09:30 EST)
   * ```
   */
  public setZone(zone: string | Zone): TimeWithZone {
    return new TimeWithZone(this.dateTime.setZone(zone))
  }
}

/**
 * Thrown when a TimeWithZone is invalid (e.g., invalid input or time values).
 * @param error - The original error (available as cause)
 * @example
 * ```ts
 * try {
 *   TimeWithZone.fromISO('25:00:00')
 * } catch (e) {
 *   if (e instanceof InvalidTimeWithZone) console.error(e.message)
 * }
 * ```
 */
export class InvalidTimeWithZone extends Error {
  constructor(error: Error) {
    super((error.message ?? '').replace('DateTime', 'TimeWithZone'))
  }
}
