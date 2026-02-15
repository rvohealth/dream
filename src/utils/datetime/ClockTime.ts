import {
  ClockTimeDiffResult,
  ClockTimeDurationUnit,
  ClockTimeUnit,
  type ClockTimeObject,
} from '../../types/clocktime.js'
import {
  type DateTimeJSOptions,
  type DateTimeOptions,
  type DateTimeUnit,
  type DurationLikeObject,
  type LocaleOptions,
  type ToISOTimeOptions,
  type Zone,
} from '../../types/datetime.js'
import { BASE_DATE_OBJECT, DateTime } from './DateTime.js'

/**
 * ClockTime represents a time of day, with or without timezone information.
 *
 * Useful for representing both TIME and TIMETZ fields from a Postgres database.
 */
export default class ClockTime {
  protected dateTime: DateTime

  /**
   * Creates a ClockTime from a DateTime or time components object with zone.
   * @param source - DateTime instance or object with time components and zone
   * @example
   * ```ts
   * new ClockTime(DateTime.now())                                              // from DateTime
   * new ClockTime({ hour: 14, minute: 30, zone: 'America/New_York' })        // 14:30:00.000000 EST/EDT
   * new ClockTime({ hour: 14, minute: 30, second: 45, zone: 'UTC' })         // 14:30:45.000000 UTC
   * new ClockTime({ hour: 14, minute: 30, second: 45, millisecond: 123, microsecond: 456, zone: 'UTC' }) // 14:30:45.123456 UTC
   * ```
   */
  protected constructor(
    source?:
      | DateTime
      | (ClockTimeObject & {
          zone?: string | Zone
        })
      | null
  ) {
    if (source instanceof DateTime) {
      this.dateTime = source
    } else if (source && typeof source === 'object') {
      this.dateTime = wrapLuxonError(() =>
        DateTime.fromObject(
          {
            ...BASE_DATE_OBJECT,
            hour: source.hour ?? 0,
            minute: source.minute ?? 0,
            second: source.second ?? 0,
            millisecond: source.millisecond ?? 0,
            microsecond: source.microsecond ?? 0,
          },
          { zone: source.zone ?? 'UTC' }
        )
      )
    } else {
      this.dateTime = ClockTime.now().toDateTime()
    }
  }

  /**
   * Create a ClockTime from a DateTime instance.
   * @param dateTime - A DateTime instance
   * @returns A ClockTime for the time portion of the DateTime
   * @example
   * ```ts
   * ClockTime.fromDateTime(DateTime.now())
   * ```
   */
  public static fromDateTime(dateTime: DateTime): ClockTime {
    return new ClockTime(dateTime)
  }

  /**
   * Create a ClockTime from a JavaScript Date.
   * @param javascriptDate - A JavaScript Date instance
   * @param options - Optional configuration
   * @param options.zone - Timezone to interpret the date in (IANA timezone name or Zone object)
   * @returns A ClockTime for the time portion
   * @example
   * ```ts
   * ClockTime.fromJSDate(new Date())
   * ClockTime.fromJSDate(new Date(), { zone: 'America/New_York' })
   * ```
   */
  public static fromJSDate(javascriptDate: Date, opts: { zone?: string | Zone } = {}): ClockTime {
    return new ClockTime(DateTime.fromJSDate(javascriptDate, opts))
  }

  /**
   * Create a ClockTime from an ISO 8601 time string.
   * @param str - ISO time string (e.g., '14:30:45.123456-05:00')
   * @param options - Optional configuration
   * @param options.zone - Timezone to interpret the time in (overrides timezone in string)
   * @returns A ClockTime for the given time
   * @throws {InvalidClockTime} When the ISO string is invalid
   * @example
   * ```ts
   * ClockTime.fromISO('14:30:45.123456')
   * ClockTime.fromISO('14:30:45.123456-05:00')
   * ```
   */
  public static fromISO(str: string, opts: { zone?: string | Zone } = {}): ClockTime {
    const dateTime = wrapLuxonError(() => DateTime.fromISO(str, opts))
    return new ClockTime(dateTime)
  }

  /**
   * Create a ClockTime from an SQL time string.
   * @param str - SQL time string (e.g., '14:30:45.123456')
   * @param options - Optional configuration
   * @param options.zone - Timezone to interpret the time in (overrides timezone in string)
   * @returns A ClockTime for the given time
   * @throws {InvalidClockTime} When the SQL string is invalid
   * @example
   * ```ts
   * ClockTime.fromSQL('14:30:45.123456')
   * ClockTime.fromSQL('14:30:45.123456+05:30')
   * ```
   */
  public static fromSQL(str: string, opts: { zone?: string | Zone } = {}): ClockTime {
    const dateTime = wrapLuxonError(() => DateTime.fromSQL(str, opts))
    return new ClockTime(dateTime)
  }

  /**
   * Create a ClockTime from a custom format string.
   * Uses Luxon format tokens (e.g., 'HH:mm:ss', 'hh:mm a').
   * @param text - The string to parse
   * @param format - Format string using Luxon tokens
   * @param opts - Optional configuration
   * @param opts.zone - Timezone to interpret the time in (IANA timezone name or Zone object)
   * @param opts.locale - Locale for parsing (e.g., 'en-US', 'fr-FR')
   * @param opts.numberingSystem - Numbering system (e.g., 'arab', 'beng')
   * @param opts.outputCalendar - Output calendar system (e.g., 'islamic', 'hebrew')
   * @returns A ClockTime for the parsed time
   * @throws {InvalidClockTime} When the string doesn't match the format or is invalid
   * @example
   * ```ts
   * ClockTime.fromFormat('14:30:45', 'HH:mm:ss')
   * ClockTime.fromFormat('2:30 PM', 'h:mm a')
   * ClockTime.fromFormat('14:30:45 -05:00', 'HH:mm:ss ZZ')
   * ```
   */
  public static fromFormat(text: string, format: string, opts?: DateTimeOptions): ClockTime {
    const dateTime = wrapLuxonError(() => DateTime.fromFormat(text, format, opts))
    return new ClockTime(dateTime)
  }

  /**
   * Create a ClockTime from an object with time units.
   * @param obj - Object with hour, minute, second, millisecond, microsecond properties
   * @param opts - Optional configuration
   * @param opts.zone - Timezone for the time (IANA timezone name or Zone object)
   * @param opts.locale - Locale (e.g., 'en-US', 'fr-FR')
   * @param opts.numberingSystem - Numbering system (e.g., 'arab', 'beng')
   * @param opts.outputCalendar - Output calendar system (e.g., 'islamic', 'hebrew')
   * @returns A ClockTime for the given components
   * @throws {InvalidClockTime} When time values are invalid
   * @example
   * ```ts
   * ClockTime.fromObject({ hour: 14, minute: 30, second: 45 })
   * ClockTime.fromObject({ hour: 14, minute: 30 }, { zone: 'America/New_York' })
   * ```
   */
  public static fromObject(obj: ClockTimeObject, opts?: DateTimeJSOptions): ClockTime {
    const dateTime = wrapLuxonError(() =>
      DateTime.fromObject(
        {
          ...BASE_DATE_OBJECT,
          ...obj,
        },
        opts
      )
    )
    return new ClockTime(dateTime)
  }

  /**
   * Returns a ClockTime for the current time.
   * @param options - Optional configuration
   * @param options.zone - Timezone for the current time (defaults to system timezone)
   * @returns A ClockTime for now
   * @example
   * ```ts
   * ClockTime.now()
   * ClockTime.now({ zone: 'America/New_York' })
   * ```
   */
  public static now({ zone }: { zone?: string | Zone } = {}): ClockTime {
    return new ClockTime(zone ? DateTime.now().setZone(zone) : DateTime.now())
  }

  /**
   * Returns the time as an ISO 8601 time string.
   * Alias for `toISOTime()`.
   *
   * @param opts - Optional format options
   * @param opts.suppressMilliseconds - If true, omits milliseconds/microseconds when they are zero
   * @param opts.suppressSeconds - If true, omits seconds when they are zero
   * @param opts.includeOffset - If true, includes timezone offset
   * @param opts.format - Format variant: 'basic' (compact) or 'extended' (default, with colons)
   * @returns ISO time string (e.g., '14:30:45.123456' or '14:30:45.123456-05:00')
   * @example
   * ```ts
   * ClockTime.fromObject({ hour: 14, minute: 30, second: 45 }).toISO()  // '14:30:45.000000'
   * ClockTime.fromISO('14:30:45-05:00').toISO({ includeOffset: true })  // '14:30:45.000000-05:00'
   * ```
   */
  public toISO(opts?: ToISOTimeOptions): string {
    return this.dateTime.toISOTime(opts)
  }

  /**
   * Returns the time as an ISO 8601 time string.
   * Alias for `toISO()`.
   *
   * @param opts - Optional format options
   * @param opts.suppressMilliseconds - If true, omits milliseconds/microseconds when they are zero
   * @param opts.suppressSeconds - If true, omits seconds when they are zero
   * @param opts.includeOffset - If true, includes timezone offset
   * @param opts.format - Format variant: 'basic' (compact) or 'extended' (default, with colons)
   * @returns ISO time string (e.g., '14:30:45.123456' or '14:30:45.123456-05:00')
   * @example
   * ```ts
   * ClockTime.fromObject({ hour: 14, minute: 30, second: 45 }).toISOTime()  // '14:30:45.000000'
   * ClockTime.fromISO('14:30:45-05:00').toISOTime({ includeOffset: true })  // '14:30:45.000000-05:00'
   * ```
   */
  public toISOTime(opts?: ToISOTimeOptions): string {
    return this.toISO(opts)
  }

  /**
   * Returns the SQL time string.
   *
   * @param opts - Optional SQL time format options
   * @param opts.includeOffset - If true, includes timezone offset
   * @returns SQL time string
   *
   */
  public toSQL(opts: { includeOffset?: boolean } = {}): string {
    return this.dateTime.toSQLTime(opts)
  }

  /**
   * Alias of `toSQL`
   */
  public toSQLTime(opts: { includeOffset?: boolean } = {}): string {
    return this.toSQL(opts)
  }

  /**
   * Returns the time as an ISO time string for JSON serialization.
   * @returns ISO time string
   * @example
   * ```ts
   * JSON.stringify({ time: ClockTime.now() })
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
   * ClockTime.now().valueOf()
   * ```
   */
  private _valueOf: string
  public valueOf(): string {
    if (this._valueOf) return this._valueOf
    this._valueOf = this.toISOTime()
    return this._valueOf
  }

  /**
   * Returns a localized string representation of the time.
   * @param formatOpts - Intl.DateTimeFormat options for formatting
   * @param opts - Optional locale configuration
   * @param opts.locale - Locale string (e.g., 'en-US', 'fr-FR')
   * @param opts.numberingSystem - Numbering system (e.g., 'arab', 'beng')
   * @param opts.outputCalendar - Calendar system (e.g., 'islamic', 'hebrew')
   * @returns Localized time string
   * @example
   * ```ts
   * ClockTime.now().toLocaleString()
   * ClockTime.now().toLocaleString({ hour: 'numeric', minute: '2-digit' })
   * ClockTime.now().toLocaleString({ hour: '2-digit' }, { locale: 'fr-FR' })
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
   * String(ClockTime.now())
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
   * const dt = ClockTime.now().toDateTime()
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
   * const jsDate = ClockTime.now().toJSDate()
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
   * ClockTime.fromObject({ hour: 14, minute: 30 }).hour  // 14
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
   * ClockTime.fromObject({ hour: 14, minute: 30 }).minute  // 30
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
   * ClockTime.fromObject({ hour: 14, minute: 30, second: 45 }).second  // 45
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
   * ClockTime.fromObject({ hour: 14, minute: 30, millisecond: 123 }).millisecond  // 123
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
   * ClockTime.fromISO('14:30:45.123456').microsecond  // 456
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
   * ClockTime.fromObject({ hour: 14 }, { zone: 'America/New_York' }).zoneName
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
   * ClockTime.fromISO('14:30:45-05:00').offset  // -300
   * ```
   */
  public get offset(): number {
    return this.dateTime.offset
  }

  /**
   * Returns a new ClockTime at the start of the given period.
   * @param period - Unit to truncate to ('hour', 'minute', or 'second')
   * @returns A ClockTime at the start of the period
   * @example
   * ```ts
   * ClockTime.fromObject({ hour: 14, minute: 30, second: 45 }).startOf('hour')
   * // hour: 14, minute: 0, second: 0
   * ```
   */
  public startOf(period: DateTimeUnit): ClockTime {
    return new ClockTime(this.dateTime.startOf(period))
  }

  /**
   * Returns a new ClockTime at the end of the given period.
   * @param period - Unit to extend to end of ('hour', 'minute', or 'second')
   * @returns A ClockTime at the end of the period
   * @example
   * ```ts
   * ClockTime.fromObject({ hour: 14, minute: 30 }).endOf('hour')
   * // hour: 14, minute: 59, second: 59, millisecond: 999
   * ```
   */
  public endOf(period: DateTimeUnit): ClockTime {
    return new ClockTime(this.dateTime.endOf(period))
  }

  /**
   * Returns a new ClockTime with the given duration added.
   * @param duration - Duration to add (object with hours, minutes, seconds, etc.)
   * @returns A new ClockTime
   * @example
   * ```ts
   * ClockTime.fromObject({ hour: 14, minute: 30 }).plus({ hours: 2, minutes: 15 })
   * // hour: 16, minute: 45
   * ```
   */
  public plus(duration: DurationLikeObject): ClockTime {
    return new ClockTime(this.dateTime.plus(duration))
  }

  /**
   * Returns a new ClockTime with the given duration subtracted.
   * @param duration - Duration to subtract (object with hours, minutes, seconds, etc.)
   * @returns A new ClockTime
   * @example
   * ```ts
   * ClockTime.fromObject({ hour: 14, minute: 30 }).minus({ hours: 2, minutes: 15 })
   * // hour: 12, minute: 15
   * ```
   */
  public minus(duration: DurationLikeObject): ClockTime {
    return new ClockTime(this.dateTime.minus(duration))
  }

  /**
   * Returns the earliest ClockTime from the given arguments.
   * @param clockTimes - ClockTimes to compare
   * @returns The earliest ClockTime
   * @example
   * ```ts
   * ClockTime.min(time1, time2, time3)
   * ```
   */
  public static min(...clockTimes: ClockTime[]): ClockTime | null {
    if (clockTimes.length === 0) return null
    return clockTimes.reduce((min, time) => (time.valueOf() < min.valueOf() ? time : min), clockTimes[0]!)
  }

  /**
   * Returns the latest ClockTime from the given arguments.
   * @param clockTimes - ClockTimes to compare
   * @returns The latest ClockTime
   * @example
   * ```ts
   * ClockTime.max(time1, time2, time3)
   * ```
   */
  public static max(...clockTimes: ClockTime[]): ClockTime | null {
    if (clockTimes.length === 0) return null
    return clockTimes.reduce((max, time) => (time.valueOf() > max.valueOf() ? time : max), clockTimes[0]!)
  }

  /**
   * Returns true if this and other are in the same unit of time.
   * @param otherClockTime - ClockTime to compare against
   * @param period - Unit to check ('hour', 'minute', or 'second')
   * @returns true if same period
   * @example
   * ```ts
   * const t1 = ClockTime.fromObject({ hour: 14, minute: 30 })
   * const t2 = ClockTime.fromObject({ hour: 14, minute: 45 })
   * t1.hasSame(t2, 'hour')    // true
   * t1.hasSame(t2, 'minute')  // false
   * ```
   */
  public hasSame(otherClockTime: ClockTime, period: ClockTimeUnit): boolean {
    const otherDateTime = otherClockTime.toDateTime()
    if (otherDateTime === null) return false
    return this.dateTime.hasSame(otherDateTime, period)
  }

  /**
   * Returns the difference between this ClockTime and another in the specified unit.
   * @param otherClockTime - ClockTime to compare against
   * @param duration - Unit for the difference ('hours', 'minutes', 'seconds', etc.)
   * @returns Numeric difference in the specified unit
   * @example
   * ```ts
   * const t1 = ClockTime.fromObject({ hour: 14, minute: 30 })
   * const t2 = ClockTime.fromObject({ hour: 10, minute: 15 })
   * t1.diff(t2, 'hours')    // 4.25
   * t1.diff(t2, 'minutes')  // 255
   * ```
   */
  /**
   * Returns the difference between this ClockTime and another in the specified unit(s).
   * Supports microsecond precision when 'microseconds' is included in the unit parameter.
   *
   * @param other - ClockTime to compare against
   * @param unit - Unit or units to return (hours, minutes, seconds, milliseconds, microseconds)
   * @returns Object with only the specified units (or all units if not specified)
   * @example
   * ```ts
   * const t1 = ClockTime.fromObject({ hour: 15, minute: 30 })
   * const t2 = ClockTime.fromObject({ hour: 14, minute: 0 })
   * t1.diff(t2, 'hours')  // { hours: 1 }
   * t1.diff(t2, ['hours', 'minutes'])  // { hours: 1, minutes: 30 }
   * t1.diff(t2)  // { hours: 1, minutes: 30, seconds: 0, milliseconds: 0, microseconds: 0 }
   * ```
   */
  public diff<U extends ClockTimeDurationUnit | ClockTimeDurationUnit[] | undefined = undefined>(
    other: ClockTime,
    unit?: U
  ): ClockTimeDiffResult<U> {
    const otherDateTime = other.toDateTime()
    const unitArray = unit === undefined ? undefined : Array.isArray(unit) ? unit : [unit]
    const result = this.dateTime.diff(otherDateTime, unitArray as any) as Record<string, number>
    const filtered: Record<string, number> = {}

    const requestedUnits: ClockTimeDurationUnit[] =
      unit === undefined
        ? ['hours', 'minutes', 'seconds', 'milliseconds', 'microseconds']
        : Array.isArray(unit)
          ? unit
          : [unit]

    for (const requestedUnit of requestedUnits) {
      filtered[requestedUnit] = result[requestedUnit] ?? 0
    }

    return filtered as ClockTimeDiffResult<U>
  }

  /**
   * Returns the difference between this ClockTime and now in the specified unit(s).
   * Supports microsecond precision when 'microseconds' is included in the unit parameter.
   *
   * @param unit - Unit or units to return (hours, minutes, seconds, milliseconds, microseconds)
   * @returns Object with only the specified units (or all units if not specified)
   * @example
   * ```ts
   * const future = ClockTime.now().plus({ hours: 2 })
   * future.diffNow('hours')  // { hours: 2 }
   * future.diffNow(['hours', 'minutes'])  // { hours: 2, minutes: 0 }
   * ```
   */
  public diffNow<U extends ClockTimeDurationUnit | ClockTimeDurationUnit[] | undefined = undefined>(
    unit?: U
  ): ClockTimeDiffResult<U> {
    return this.diff(ClockTime.now(), unit)
  }

  /**
   * Returns true if this ClockTime equals another ClockTime.
   * @param otherClockTime - ClockTime to compare
   * @returns true if times are equal
   * @example
   * ```ts
   * const t1 = ClockTime.fromObject({ hour: 14, minute: 30 })
   * const t2 = ClockTime.fromObject({ hour: 14, minute: 30 })
   * t1.equals(t2)  // true
   * ```
   */
  public equals(otherClockTime: ClockTime): boolean {
    return this.dateTime.equals(otherClockTime.toDateTime())
  }

  /**
   * Returns a new ClockTime with the timezone changed.
   * The time value changes to reflect the same instant in the new timezone.
   * @param zone - The timezone to convert to
   * @returns A new ClockTime in the specified timezone
   * @example
   * ```ts
   * const utc = ClockTime.fromObject({ hour: 14, minute: 30 }, { zone: 'UTC' })
   * const ny = utc.setZone('America/New_York')
   * // Time is converted to New York timezone (e.g., 09:30 EST)
   * ```
   */
  public setZone(zone: string | Zone): ClockTime {
    return new ClockTime(this.dateTime.setZone(zone))
  }
}

/**
 * Thrown when a ClockTime is invalid (e.g., invalid input or time values).
 * @param error - The original error (available as cause)
 * @example
 * ```ts
 * try {
 *   ClockTime.fromISO('25:00:00')
 * } catch (e) {
 *   if (e instanceof InvalidClockTime) console.error(e.message)
 * }
 * ```
 */
export class InvalidClockTime extends Error {
  constructor(error: Error) {
    super((error.message ?? '').replace('DateTime', 'ClockTime'))
  }
}

function wrapLuxonError<T>(fn: () => T): T {
  try {
    return fn()
  } catch (error) {
    if (error instanceof Error) throw new InvalidClockTime(error)
    throw error
  }
}
